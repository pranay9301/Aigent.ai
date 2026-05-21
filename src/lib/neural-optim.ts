// --- 1. Memory-Safe Neural Caching ---
// Using Map for serverless-friendly ephemeral caching
const memCache = new Map<string, { value: any, expires: number }>();

// Persistence hook — set by server-cache.ts to persist to Firestore
let persistFn: ((key: string, value: any, expiresAt: number) => void) | null = null;

export const cache = {
  get: (key: string) => {
    const entry = memCache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.value;
    }
    if (entry) memCache.delete(key);
    return null;
  },
  set: (key: string, value: any, ttlSeconds: number = 3600) => {
    const expires = Date.now() + (ttlSeconds * 1000);
    memCache.set(key, { value, expires });

    // Fire-and-forget persistence to Firestore
    if (persistFn) {
      try { persistFn(key, value, expires); } catch {}
    }

    // Simple cleanup for memory protection (keep under 500 entries)
    if (memCache.size > 500) {
      const firstKey = memCache.keys().next().value;
      if (firstKey !== undefined) memCache.delete(firstKey);
    }
  }
};

export const setPersistFn = (fn: (key: string, value: any, expiresAt: number) => void) => {
  persistFn = fn;
};

// --- 2. Safe Context Extraction (Simplified for Serverless) ---
export const pruneContext = (code: string): string => {
  if (!code || typeof code !== 'string') return "";
  
  // High-performance structural pruning without native dependencies
  try {
    const lines = code.split('\n');
    const filtered = lines.filter(line => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith('export ') ||
        trimmed.startsWith('import ') ||
        trimmed.startsWith('interface ') ||
        trimmed.startsWith('type ') ||
        trimmed.startsWith('function ') ||
        trimmed.startsWith('class ') ||
        trimmed.startsWith('const ') ||
        trimmed.startsWith('let ') ||
        trimmed.includes('(') // Likely a signature
      );
    });

    if (filtered.length === 0) return code.slice(0, 800);
    return filtered.join('\n').slice(0, 1500);
  } catch (err) {
    console.warn("Neural Pruning Warning:", err);
    return code.slice(0, 1000); 
  }
};

// --- 3. Neural Serialization Utilities ---
export const serialize = (data: any) => JSON.stringify(data);
export const deserialize = (str: string) => JSON.parse(str);
