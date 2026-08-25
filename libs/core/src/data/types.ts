/** A closed, inclusive index range. Mirrors the shape of `LoadEventPayload`. */
export interface Range {
  startIndex: number;
  endIndex: number;
}

/**
 * Supplied by the consumer: resolve the rows for an inclusive index range.
 *
 * This is the single fetch path — the viewport, `getRange`, `scan()` and the
 * background scanner all go through it, which is what makes background work
 * behave exactly "as if the rows were coming into view but not rendering".
 *
 * It must resolve exactly `endIndex - startIndex + 1` rows, in index order.
 */
export type FetchRange<T> = (
  startIndex: number,
  endIndex: number
) => Promise<T[]> | T[];

export type RowStoreKind = 'memory' | 'indexeddb';

/**
 * Storage boundary for rows.
 *
 * Every read/write is async regardless of backend ("async parity"), so a
 * consumer never branches on where the bytes live and swapping backends is a
 * one-line config change.
 *
 * The two synchronous members are the deliberate exception. Rendering happens
 * inside a Vue `computed` / React `useMemo`, so the visible window has to be
 * readable without awaiting or the list flashes empty on every scroll tick.
 * Implementations keep a "hot window" — the visible range plus buffer, and
 * nothing else — resident in a plain Map for `peek()` to read.
 */
export interface RowStore<T = unknown> {
  readonly kind: RowStoreKind;

  /** Resolve one row, or `undefined` if it was never loaded. */
  get(index: number): Promise<T | undefined>;

  /** Resolve an inclusive range; unloaded positions come back `undefined`. */
  getMany(startIndex: number, endIndex: number): Promise<Array<T | undefined>>;

  /** Write `rows` starting at `startingIndex`, overwriting any existing rows. */
  set(startingIndex: number, rows: T[]): Promise<void>;

  /** Drop every row. */
  clear(): Promise<void>;

  /** Drop the rows in an inclusive range. */
  delete(startIndex: number, endIndex: number): Promise<void>;

  /** Synchronous membership test — cheap enough to call per rendered row. */
  has(index: number): boolean;

  /**
   * Synchronous read of whatever is currently resident. Always returns an array
   * of `endIndex - startIndex + 1` entries; non-resident positions are
   * `undefined`. Only the hot window is guaranteed resident.
   */
  peek(startIndex: number, endIndex: number): Array<T | undefined>;

  /** Move the resident window; resolves once the new window is hydrated. */
  setHotWindow(startIndex: number, endIndex: number): Promise<void>;

  /** How many rows the store holds in total, resident or not. */
  loadedCount(): number;

  /** How many rows are currently held in memory. */
  residentCount(): number;

  /** Release the backend. The store is unusable afterwards. */
  dispose(): Promise<void>;
}

export interface ScanProgress {
  processedItems: number;
  totalItems: number;
  running: boolean;
  done: boolean;
}

export interface SourceStats {
  /** Rows held by the store, whether resident or spilled to IndexedDB. */
  loadedCount: number;
  /** Rows currently held in memory. Equals `loadedCount` for the memory backend. */
  residentCount: number;
  totalItems: number;
  background: ScanProgress;
}

export interface ScanBatch<T> {
  startIndex: number;
  endIndex: number;
  rows: Array<T | undefined>;
}
