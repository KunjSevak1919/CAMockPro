// ============================================================
// MockCA.ai — Pinecone Vector DB
// Index: mockca-questions | Dims: 1536 | Metric: cosine
// All vector DB queries must go through this module only.
// ============================================================

import { Pinecone } from "@pinecone-database/pinecone";
import type { Index } from "@pinecone-database/pinecone";

let _pc: Pinecone | null = null;
let _index: Index | null = null;

function getClient(): Pinecone {
  if (!_pc) {
    _pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return _pc;
}

// Lazy-evaluated so PINECONE_INDEX_NAME is only read at request time,
// never at module-load / build time.
export function getIndex(): Index {
  if (!_index) {
    _index = getClient().index(process.env.PINECONE_INDEX_NAME!);
  }
  return _index;
}

export { getClient as pinecone };
