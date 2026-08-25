import { LoadedRanges } from './loaded-ranges';
import type { RowStore, RowStoreKind } from './types';

/**
 * Default backend: every row lives on the heap.
 *
 * `peek` can serve any loaded row because everything is resident, but the
 * methods are still promise-returning so that swapping in the IndexedDB backend
 * is a config change rather than a rewrite.
 */
export class MemoryRowStore<T = unknown> implements RowStore<T> {
  readonly kind: RowStoreKind = 'memory';

  private rows = new Map<number, T>();
  private loaded = new LoadedRanges();

  async get(index: number): Promise<T | undefined> {
    return this.rows.get(index);
  }

  async getMany(startIndex: number, endIndex: number): Promise<Array<T | undefined>> {
    return this.peek(startIndex, endIndex);
  }

  async set(startingIndex: number, rows: T[]): Promise<void> {
    if (!rows.length) return;
    for (let i = 0; i < rows.length; i++) {
      this.rows.set(startingIndex + i, rows[i]);
    }
    this.loaded.add(startingIndex, startingIndex + rows.length - 1);
  }

  async clear(): Promise<void> {
    this.rows.clear();
    this.loaded.clear();
  }

  async delete(startIndex: number, endIndex: number): Promise<void> {
    for (let i = startIndex; i <= endIndex; i++) {
      this.rows.delete(i);
    }
    this.loaded.remove(startIndex, endIndex);
  }

  has(index: number): boolean {
    return this.loaded.has(index);
  }

  peek(startIndex: number, endIndex: number): Array<T | undefined> {
    const out: Array<T | undefined> = new Array(Math.max(0, endIndex - startIndex + 1));
    for (let i = 0; i < out.length; i++) {
      out[i] = this.rows.get(startIndex + i);
    }
    return out;
  }

  /** No-op: nothing is ever evicted, so every loaded row is already resident. */
  async setHotWindow(): Promise<void> {
    return;
  }

  loadedCount(): number {
    return this.loaded.count();
  }

  residentCount(): number {
    return this.rows.size;
  }

  async dispose(): Promise<void> {
    await this.clear();
  }
}
