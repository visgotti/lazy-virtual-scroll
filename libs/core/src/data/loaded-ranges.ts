import type { Range } from './types';

/**
 * A sorted, non-overlapping interval set over row indexes.
 *
 * Loads are always range-shaped, so tracking intervals rather than a per-row
 * bitmap keeps this tiny (a handful of entries in practice, not one byte per
 * row) while still answering "is this loaded?" and "what is still missing?"
 * synchronously — which is what lets the scheduler decide what to fetch next
 * without awaiting, and lets the render path test membership per row.
 */
export class LoadedRanges {
  private ranges: Range[] = [];

  /** Index of the last range starting at or before `index`, or -1. */
  private floorIndex(index: number): number {
    let lo = 0;
    let hi = this.ranges.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.ranges[mid].startIndex <= index) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found;
  }

  has(index: number): boolean {
    const i = this.floorIndex(index);
    return i !== -1 && this.ranges[i].endIndex >= index;
  }

  add(startIndex: number, endIndex: number): void {
    if (endIndex < startIndex) return;

    // Insertion point, then absorb every range that touches or overlaps the new
    // one. Adjacency counts (`end + 1 === start`) so contiguous batches collapse.
    let insertAt = 0;
    while (
      insertAt < this.ranges.length &&
      this.ranges[insertAt].endIndex + 1 < startIndex
    ) {
      insertAt++;
    }

    let mergedStart = startIndex;
    let mergedEnd = endIndex;
    let removeCount = 0;
    for (let i = insertAt; i < this.ranges.length; i++) {
      const r = this.ranges[i];
      if (r.startIndex > endIndex + 1) break;
      mergedStart = Math.min(mergedStart, r.startIndex);
      mergedEnd = Math.max(mergedEnd, r.endIndex);
      removeCount++;
    }

    this.ranges.splice(insertAt, removeCount, {
      startIndex: mergedStart,
      endIndex: mergedEnd,
    });
  }

  remove(startIndex: number, endIndex: number): void {
    if (endIndex < startIndex) return;

    const next: Range[] = [];
    for (const r of this.ranges) {
      if (r.endIndex < startIndex || r.startIndex > endIndex) {
        next.push(r);
        continue;
      }
      // Left remainder, then right remainder; either may be empty.
      if (r.startIndex < startIndex) {
        next.push({ startIndex: r.startIndex, endIndex: startIndex - 1 });
      }
      if (r.endIndex > endIndex) {
        next.push({ startIndex: endIndex + 1, endIndex: r.endIndex });
      }
    }
    this.ranges = next;
  }

  /** The sub-ranges of `[startIndex, endIndex]` that are not yet loaded. */
  missingWithin(startIndex: number, endIndex: number): Range[] {
    const gaps: Range[] = [];
    let cursor = startIndex;

    for (const r of this.ranges) {
      if (r.endIndex < cursor) continue;
      if (r.startIndex > endIndex) break;
      if (r.startIndex > cursor) {
        gaps.push({ startIndex: cursor, endIndex: Math.min(r.startIndex - 1, endIndex) });
      }
      cursor = Math.max(cursor, r.endIndex + 1);
      if (cursor > endIndex) return gaps;
    }

    if (cursor <= endIndex) {
      gaps.push({ startIndex: cursor, endIndex });
    }
    return gaps;
  }

  /** First unloaded index in `[from, to]`, or null if the span is covered. */
  firstMissing(from: number, to: number): number | null {
    if (from > to) return null;
    let cursor = from;
    for (const r of this.ranges) {
      if (r.endIndex < cursor) continue;
      if (r.startIndex > cursor) break;
      cursor = r.endIndex + 1;
      if (cursor > to) return null;
    }
    return cursor <= to ? cursor : null;
  }

  count(): number {
    return this.ranges.reduce(
      (total, r) => total + (r.endIndex - r.startIndex + 1),
      0
    );
  }

  clear(): void {
    this.ranges = [];
  }

  toArray(): Range[] {
    return this.ranges.map((r) => ({ ...r }));
  }
}
