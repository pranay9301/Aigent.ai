import { DatabaseSync } from "node:sqlite";
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import msgpack from "msgpack-lite";
import * as fs from "fs";
import * as path from "path";

// --- 1. Local Neural Caching (SQLite) ---
const dbPath = path.join(process.cwd(), "neural_cache.db");
const db = new DatabaseSync(dbPath);

// Initialize Cache Table
db.exec(`
  CREATE TABLE IF NOT EXISTS neural_cache (
    key TEXT PRIMARY KEY,
    value BLOB,
    expires_at INTEGER
  )
`);

export const cache = {
  get: (key: string) => {
    const row = db.prepare("SELECT value FROM neural_cache WHERE key = ? AND expires_at > ?").get(key, Date.now()) as any;
    if (row) {
      return msgpack.decode(Buffer.from(row.value));
    }
    return null;
  },
  set: (key: string, value: any, ttlSeconds: number = 3600) => {
    const encoded = msgpack.encode(value);
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    db.prepare("INSERT OR REPLACE INTO neural_cache (key, value, expires_at) VALUES (?, ?, ?)").run(key, encoded, expiresAt);
  }
};

// --- 2. Surgical Context Extraction (Tree-sitter) ---
const parser = new Parser();
const typescriptLang = (TypeScript as any).typescript || (TypeScript as any);
parser.setLanguage(typescriptLang);

export const pruneContext = (code: string): string => {
  try {
    const tree = parser.parse(code);
    const root = tree.rootNode;
    
    // We extract only important nodes (Interface declarations, Function signatures, Class definitions)
    // to reduce token noise while keeping structural integrity.
    const nodes = root.descendantsOfType([
      "interface_declaration",
      "function_declaration",
      "class_declaration",
      "method_definition",
      "type_alias_declaration",
      "export_statement"
    ]);

    if (nodes.length === 0) return code.slice(0, 500); // Fallback for very small files

    return nodes.map(node => node.text).join("\n\n");
  } catch (err) {
    console.error("Neural Pruning Error:", err);
    return code.slice(0, 1000); // Safe fallback
  }
};

// --- 3. Binary Serialization Utilities ---
export const serialize = (data: any) => msgpack.encode(data);
export const deserialize = (buffer: Buffer) => msgpack.decode(buffer);
