// Tiny storage layer: Upstash Redis in prod, JSON file in dev (no env).
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

type Json = any;

interface Store {
  get<T = Json>(k: string): Promise<T | null>;
  set(k: string, v: Json, ttlSec?: number): Promise<void>;
  del(k: string): Promise<void>;
  sadd(k: string, ...m: string[]): Promise<void>;
  srem(k: string, m: string): Promise<void>;
  smembers(k: string): Promise<string[]>;
  sismember(k: string, m: string): Promise<boolean>;
  incr(k: string, ttlSec?: number): Promise<number>;
}

class RedisStore implements Store {
  r = new Redis({ url: (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)!, token: (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)! });
  async get<T>(k: string) { return ((await this.r.get(k)) as T) ?? null; }
  async set(k: string, v: Json, ttl?: number) { ttl ? await this.r.set(k, v, { ex: ttl }) : await this.r.set(k, v); }
  async del(k: string) { await this.r.del(k); }
  async sadd(k: string, ...m: string[]) { if (m.length) await (this.r as any).sadd(k, ...m); }
  async srem(k: string, m: string) { await this.r.srem(k, m); }
  async smembers(k: string) { return ((await this.r.smembers(k)) as string[]) || []; }
  async sismember(k: string, m: string) { return (await this.r.sismember(k, m)) === 1; }
  async incr(k: string, ttl?: number) { const n = await this.r.incr(k); if (ttl && n === 1) await this.r.expire(k, ttl); return n; }
}

class FileStore implements Store {
  file = path.join(process.cwd(), ".data", "db.json");
  load(): Record<string, { v: Json; exp?: number }> {
    try { return JSON.parse(fs.readFileSync(this.file, "utf8")); } catch { return {}; }
  }
  save(d: Record<string, any>) { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(d)); }
  raw(k: string) { const d = this.load(); const e = d[k]; if (!e) return null; if (e.exp && e.exp < Date.now()) return null; return e.v; }
  async get<T>(k: string) { return this.raw(k) as T | null; }
  async set(k: string, v: Json, ttl?: number) { const d = this.load(); d[k] = { v, exp: ttl ? Date.now() + ttl * 1000 : undefined }; this.save(d); }
  async del(k: string) { const d = this.load(); delete d[k]; this.save(d); }
  async sadd(k: string, ...m: string[]) { const s = new Set<string>(this.raw(k) || []); m.forEach((x) => s.add(x)); await this.set(k, [...s]); }
  async srem(k: string, m: string) { const s = new Set<string>(this.raw(k) || []); s.delete(m); await this.set(k, [...s]); }
  async smembers(k: string) { return (this.raw(k) as string[]) || []; }
  async sismember(k: string, m: string) { return ((this.raw(k) as string[]) || []).includes(m); }
  async incr(k: string, ttl?: number) { const n = (Number(this.raw(k)) || 0) + 1; await this.set(k, n, ttl); return n; }
}

export const db: Store = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) ? new RedisStore() : new FileStore();
