import { MOCK } from "./config";

export type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: Msg[], opts: { temperature?: number; json?: boolean; maxTokens?: number } = {}): Promise<string> {
  if (MOCK) return mockAnswer(messages, opts.json);
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY manquante : ajoutez-la dans Vercel puis redéployez");
  // llama-3.3-70b-versatile was retired for free/dev tiers on 2026-08-16 → default to gpt-oss-120b.
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const reasoning = /gpt-oss|qwen3/i.test(model);
  const body: any = {
    model, messages, temperature: opts.temperature ?? 0.7,
    // reasoning models spend tokens thinking before answering: give them headroom, keep the thinking short and hidden
    max_completion_tokens: (opts.maxTokens ?? 700) + (reasoning ? 1500 : 0),
  };
  if (/gpt-oss/i.test(model)) { body.reasoning_effort = "low"; body.include_reasoning = false; }
  else if (reasoning) body.reasoning_format = "hidden";
  if (opts.json) body.response_format = { type: "json_object" };
  for (let i = 0; i < 3; i++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.status === 429 || res.status >= 500) {
      // rate-limited: wait what Groq asks (max 8 s), and fall back to the smaller model on the last try
      const ra = Math.min(8, Number(res.headers.get("retry-after")) || 2 * (i + 1));
      await new Promise((r) => setTimeout(r, ra * 1000));
      if (i === 1 && /gpt-oss-120b/.test(body.model)) body.model = process.env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-20b";
      continue;
    }
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const d = await res.json();
    const out = (d.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (!out) throw new Error(`Réponse IA vide (modèle ${model}, fin : ${d.choices?.[0]?.finish_reason})`);
    return out;
  }
  throw new Error("Groq indisponible (limite de débit atteinte)");
}

export async function chatJson<T>(messages: Msg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<T> {
  const t = await chat(messages, { ...opts, json: true });
  try { return JSON.parse(t) as T; } catch { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]) as T; throw new Error("Bad JSON from AI"); }
}

// Describe a photo (Gemini vision) — used to write accurate posts from real photos.
export async function describeImage(url: string): Promise<string> {
  if (MOCK || !process.env.GEMINI_API_KEY) return "Photo de l'établissement (description indisponible en mode test).";
  const img = await fetch(url);
  if (!img.ok) return "";
  const b64 = Buffer.from(await img.arrayBuffer()).toString("base64");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Décris factuellement cette photo d'un commerce en une phrase (ce qu'on voit, sans inventer)." }, { inline_data: { mime_type: img.headers.get("content-type") || "image/jpeg", data: b64 } }] }] }),
  });
  if (!res.ok) return "";
  const d = await res.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function mockAnswer(messages: Msg[], json?: boolean): string {
  const last = messages[messages.length - 1]?.content || "";
  if (json && /march[ée]s publics/i.test(messages[0]?.content || "")) {
    return JSON.stringify({ resume: "Remplacement des tuiles et de la zinguerie de l'école Jean Moulin, pendant les vacances.", montant: "85 000 € HT", lots: "Lot unique", duree: "3 mois", visite: "Obligatoire le 12/10", criteres: "Prix 60 %, valeur technique 40 %", accessible: "oui", pourquoi: "Montant modéré, lot unique et aucun chiffre d'affaires minimum exigé." });
  }
  if (json && /posts/i.test(messages[0]?.content || "")) {
    return JSON.stringify({ posts: [
      { title: "Nouveauté de la semaine", text: "Cette semaine, venez découvrir notre sélection du moment ! Toute l'équipe vous attend avec le sourire. À très vite 👋", cta: "LEARN_MORE" },
      { title: "Merci à vous", text: "Merci pour vos nombreux avis ces derniers jours, ils nous font chaud au cœur. On continue à tout donner pour vous accueillir au mieux !", cta: "CALL" },
    ] });
  }
  if (/note\s*:\s*[12]/i.test(last)) return "Bonjour, merci d'avoir pris le temps de nous faire ce retour. Nous sommes sincèrement désolés que votre expérience n'ait pas été à la hauteur. Nous en avons parlé en équipe et aimerions en discuter avec vous : n'hésitez pas à nous contacter directement. À bientôt, nous l'espérons.";
  return "Merci beaucoup pour ce retour chaleureux ! Toute l'équipe est ravie que votre visite vous ait plu. Au plaisir de vous revoir très bientôt !";
}
