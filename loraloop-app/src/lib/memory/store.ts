// Memory store — stubbed out (not used in Brand Knowledge Base flow)
import type { MemoryRecord, UpsertMemoryInput } from './types';

export async function upsertMemory(_input: UpsertMemoryInput): Promise<MemoryRecord> {
  throw new Error('Memory store not available in this build');
}

export async function supersedeMemory(_oldId: string, _newId: string | null): Promise<void> {}
export async function deleteMemory(_id: string): Promise<void> {}
export async function getMemoryById(_id: string): Promise<MemoryRecord | null> { return null; }
