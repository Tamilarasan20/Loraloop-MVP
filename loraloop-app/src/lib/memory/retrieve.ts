// Memory retrieve — stubbed out (not used in Brand Knowledge Base flow)
import type { RetrievalQuery, RetrievalResult } from './types';

export async function retrieveMemories(_q: RetrievalQuery): Promise<RetrievalResult[]> {
  return [];
}

export interface ChunkRetrievalQuery {
  workspaceId: string;
  query: string;
  limit?: number;
  candidateN?: number;
}

export interface ChunkRetrievalResult {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
  chunkIndex: number;
  score: number;
  source: string;
}

export async function retrieveChunks(_q: ChunkRetrievalQuery): Promise<ChunkRetrievalResult[]> {
  return [];
}

export function formatContextBlock(_results: RetrievalResult[]): string {
  return '';
}
