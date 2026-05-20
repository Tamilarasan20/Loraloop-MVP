// Memory ingest — stubbed out (not used in Brand Knowledge Base flow)
import type { IngestDocumentInput, IngestDocumentResult } from './types';

export async function ingestDocument(_opts: IngestDocumentInput): Promise<IngestDocumentResult> {
  return { documentId: 'stub', chunkCount: 0 };
}
