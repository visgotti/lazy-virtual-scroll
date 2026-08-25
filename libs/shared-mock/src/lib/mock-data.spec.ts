import { getLoremText } from './mock-data';

describe('getLoremText', () => {
  it('is deterministic: the same index always yields the same text', () => {
    expect(getLoremText(7)).toBe(getLoremText(7));
  });

  it('gives different items different text', () => {
    expect(getLoremText(0)).not.toBe(getLoremText(1));
  });

  it('returns four sentences by default', () => {
    // Every sentence in the pool ends in a period, so counting them is enough.
    expect(getLoremText(0).match(/\./g)).toHaveLength(4);
  });

  it('honours a custom sentence count', () => {
    expect(getLoremText(0, 1).match(/\./g)).toHaveLength(1);
    expect(getLoremText(0, 6).match(/\./g)).toHaveLength(6);
  });

  it('wraps around the sentence pool rather than running out', () => {
    // Asking for more sentences than the pool holds must still return that many.
    const text = getLoremText(0, 20);
    expect(text.match(/\./g)).toHaveLength(20);
    expect(text.length).toBeGreaterThan(0);
  });

  it('wraps the index too, so a far-off row still gets text', () => {
    expect(getLoremText(100_000)).toBe(getLoremText(100_000 % 8));
  });

  it('separates sentences with a single space', () => {
    expect(getLoremText(0, 2)).not.toMatch(/\s{2,}/);
  });
});
