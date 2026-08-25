import { LoadedRanges } from './loaded-ranges';

describe('LoadedRanges', () => {
  it('reports nothing loaded when empty', () => {
    const r = new LoadedRanges();
    expect(r.has(0)).toBe(false);
    expect(r.count()).toBe(0);
    expect(r.toArray()).toEqual([]);
  });

  it('records a single range and answers membership at its edges', () => {
    const r = new LoadedRanges();
    r.add(5, 9);
    expect(r.has(4)).toBe(false);
    expect(r.has(5)).toBe(true);
    expect(r.has(7)).toBe(true);
    expect(r.has(9)).toBe(true);
    expect(r.has(10)).toBe(false);
    expect(r.count()).toBe(5);
  });

  it('merges overlapping and adjacent ranges regardless of insertion order', () => {
    const r = new LoadedRanges();
    r.add(10, 14);
    r.add(0, 4);
    r.add(5, 9);
    expect(r.toArray()).toEqual([{ startIndex: 0, endIndex: 14 }]);
    expect(r.count()).toBe(15);
  });

  it('keeps disjoint ranges separate and sorted', () => {
    const r = new LoadedRanges();
    r.add(20, 24);
    r.add(0, 4);
    expect(r.toArray()).toEqual([
      { startIndex: 0, endIndex: 4 },
      { startIndex: 20, endIndex: 24 },
    ]);
    expect(r.count()).toBe(10);
  });

  it('does not double count a range added twice', () => {
    const r = new LoadedRanges();
    r.add(0, 9);
    r.add(3, 6);
    expect(r.count()).toBe(10);
    expect(r.toArray()).toEqual([{ startIndex: 0, endIndex: 9 }]);
  });

  it('returns the whole span as missing when nothing is loaded', () => {
    const r = new LoadedRanges();
    expect(r.missingWithin(0, 4)).toEqual([{ startIndex: 0, endIndex: 4 }]);
  });

  it('returns no gaps when the span is fully covered', () => {
    const r = new LoadedRanges();
    r.add(0, 100);
    expect(r.missingWithin(10, 20)).toEqual([]);
  });

  it('returns interior gaps only, clipped to the requested span', () => {
    const r = new LoadedRanges();
    r.add(0, 4);
    r.add(10, 14);
    expect(r.missingWithin(0, 19)).toEqual([
      { startIndex: 5, endIndex: 9 },
      { startIndex: 15, endIndex: 19 },
    ]);
    expect(r.missingWithin(3, 11)).toEqual([{ startIndex: 5, endIndex: 9 }]);
  });

  it('finds the first missing index at or after a cursor', () => {
    const r = new LoadedRanges();
    r.add(0, 9);
    r.add(20, 29);
    expect(r.firstMissing(0, 99)).toBe(10);
    expect(r.firstMissing(15, 99)).toBe(15);
    expect(r.firstMissing(25, 99)).toBe(30);
  });

  it('returns null when everything from the cursor onward is loaded', () => {
    const r = new LoadedRanges();
    r.add(0, 99);
    expect(r.firstMissing(0, 99)).toBe(null);
  });

  it('clears back to empty', () => {
    const r = new LoadedRanges();
    r.add(0, 99);
    r.clear();
    expect(r.count()).toBe(0);
    expect(r.has(0)).toBe(false);
  });
});
