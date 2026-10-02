// Google Places API (New) — official. Used for prospect sourcing and client photos.
import { MOCK } from "./config";
import crypto from "crypto";

export const reviewKey = (t?: string, a?: string | null) => crypto.createHash("sha1").update(`${t || ""}|${a || ""}`).digest("hex").slice(0, 12);

const KEY = () => process.env.GOOGLE_PLACES_API_KEY || "";

export type Place = {
  placeId: string; name: string; address: string; city: string; category: string | null; rating: number | null; reviewCount: number;
  website: string | null; phone: string | null; mapsUrl: string | null; businessStatus: string | null;
  reviews: { key: string; author: string | null; authorUri: string | null; rating: number; text: string; publishTime: string; relative: string | null }[];
  photoNames: string[];
};

const FIELDS = "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.primaryTypeDisplayName,places.businessStatus,places.reviews,places.photos";

function toPlace(p: any): Place {
  const city = (p.addressComponents || []).find((c: any) => (c.types || []).includes("locality"))?.longText
    || (p.formattedAddress || "").split(",").slice(-2, -1)[0]?.replace(/\d{5}/, "").trim() || "";
  return {
    placeId: p.id, name: p.displayName?.text || "", address: p.formattedAddress || "", city,
    category: p.primaryTypeDisplayName?.text || null, rating: p.rating ?? null, reviewCount: p.userRatingCount ?? 0,
    website: p.websiteUri || null, phone: p.nationalPhoneNumber || null, mapsUrl: p.googleMapsUri || null, businessStatus: p.businessStatus || null,
    reviews: (p.reviews || []).map((r: any) => ({ key: reviewKey(r.publishTime, r.authorAttribution?.displayName), author: r.authorAttribution?.displayName || null, authorUri: r.authorAttribution?.uri || null, rating: r.rating, text: r.originalText?.text || r.text?.text || "", publishTime: r.publishTime, relative: r.relativePublishTimeDescription || null })),
    photoNames: (p.photos || []).slice(0, 6).map((ph: any) => ph.name),
  };
}

export const LIGHT_FIELDS = "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.userRatingCount,places.websiteUri,places.businessStatus";
export async function textSearch(query: string, maxPages = 3, fields = FIELDS): Promise<Place[]> {
  if (MOCK) return [mockPlace(query)];
  const out: Place[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "content-type": "application/json", "X-Goog-Api-Key": KEY(), "X-Goog-FieldMask": fields + ",nextPageToken" },
      body: JSON.stringify({ textQuery: query, languageCode: "fr", regionCode: "FR", pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
    });
    if (!res.ok) throw new Error(`Places ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const d = await res.json();
    out.push(...(d.places || []).map(toPlace));
    pageToken = d.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

export async function placeDetails(placeId: string): Promise<Place | null> {
  if (MOCK) return mockPlace("détails");
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`, {
    headers: { "X-Goog-Api-Key": KEY(), "X-Goog-FieldMask": FIELDS.replace(/places\./g, "") },
  });
  if (!res.ok) return null;
  return toPlace(await res.json());
}

// Returns a key-less public googleusercontent URL.
export async function photoUrl(photoName: string, maxWidth = 1200): Promise<string | null> {
  if (MOCK) return null;
  const res = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true&key=${KEY()}`);
  if (!res.ok) return null;
  const d = await res.json();
  return d.photoUri || null;
}

function mockPlace(q: string): Place {
  return {
    placeId: "mock-" + q.replace(/\W/g, "").slice(0, 10), name: "Snack du Port", address: "12 quai Cronstadt, 83000 Toulon", city: "Toulon", category: "Restaurant de kebab",
    rating: 4.3, reviewCount: 187, website: "https://example.com", phone: "04 94 00 00 00", mapsUrl: "https://maps.google.com", businessStatus: "OPERATIONAL",
    reviews: [
      { key: "k1", author: "Julien Martin", authorUri: null, relative: "il y a 3 jours", rating: 5, text: "Super accueil, le kebab était excellent et copieux. Frites maison au top !", publishTime: "2026-09-27T10:00:00Z" },
      { key: "k2", author: "Sophie L.", authorUri: null, relative: "il y a une semaine", rating: 2, text: "Attente beaucoup trop longue un samedi soir, 40 minutes pour une commande à emporter.", publishTime: "2026-09-21T10:00:00Z" },
      { key: "k3", author: "Karim", authorUri: null, relative: "il y a 2 semaines", rating: 4, text: "Bon rapport qualité prix, personnel sympa. Un peu bruyant.", publishTime: "2026-09-15T10:00:00Z" },
    ],
    photoNames: [],
  };
}
