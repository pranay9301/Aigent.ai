import { createRequire } from "module";
const require = createRequire(import.meta.url);

// --- 1. Memory-Safe Neural Caching ---
// Using Map for serverless-friendly ephemeral caching
const memCache = new Map<string, { value: any, expires: number }>();

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
    memCache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
    
    // Simple cleanup for memory protection (keep under 500 entries)
    if (memCache.size > 500) {
      const firstKey = memCache.keys().next().value;
      if (firstKey !== undefined) memCache.delete(firstKey);
    }
  }
};

// --- 2. Safe Context Extraction ---
// We avoid crashing if native tree-sitter modules fail to load in serverless environments
let parser: any = null;

const getParser = () => {
  if (parser) return parser;
  try {
    const Parser = require("tree-sitter");
    const TypeScript = require("tree-sitter-typescript");
    parser = new Parser();
    const typescriptLang = TypeScript.typescript || TypeScript;
    parser.setLanguage(typescriptLang);
    return parser;
  } catch (err) {
    console.warn("Neural Warning: Native tree-sitter omitted in this environment. Falling back to simple pruning.");
    return null;
  }
};

export const pruneContext = (code: string): string => {
  const p = getParser();
  if (!p) return code.slice(0, 1500); // Robust fallback

  try {
    const tree = p.parse(code);
    const root = tree.rootNode;
    
    // We extract only important nodes (Interface declarations, Function signatures, Class definitions)
    const nodes = root.descendantsOfType([
      "interface_declaration",
      "function_declaration",
      "class_declaration",
      "method_definition",
      "type_alias_declaration",
      "export_statement"
    ]);

    if (nodes.length === 0) return code.slice(0, 800);

    return nodes.map((node: any) => node.text).join("\n\n");
  } catch (err) {
    console.error("Neural Pruning Error:", err);
    return code.slice(0, 1000); 
  }
};

// --- 3. Binary Serialization Utilities (Minimal) ---
export const serialize = (data: any) => JSON.stringify(data);
export const deserialize = (str: string) => JSON.parse(str);
