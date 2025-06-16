import { resolveIndexes } from './calcs'; // Adjust the import according to your file structure
describe('resolveIndexes', () => {
  it('should correctly resolve indexes and heights for static item sizes', () => {
    const params = {
      scrollTop: 0,
      viewHeight: 300,
      itemSize: 30,
      totalItems: 100,
      itemBuffer: 3,
      dynamicSizes: {},
    };
    const {
      totalItemHeight,
      scrollTopPadding,
      startIndex,
      endIndex,
    } = resolveIndexes(params);

    expect(totalItemHeight).toBe(params.itemSize * params.totalItems);
    expect(scrollTopPadding).toBe(0);
    expect(startIndex).toBe(0);
    expect(endIndex).toBe(12);
  });

  it('should correctly resolve indexes and heights for static item sizes with a little scroll top', () => {
    const params = {
      scrollTop: 40,
      viewHeight: 300,
      itemSize: 30,
      totalItems: 100,
      itemBuffer: 3,
      dynamicSizes: {},
    };
    const {
      totalItemHeight,
      scrollTopPadding,
      startIndex,
      endIndex,
    } = resolveIndexes(params);

    expect(totalItemHeight).toBe(params.itemSize * params.totalItems);
    expect(startIndex).toBe(0);
    expect(scrollTopPadding).toBe(40);
    expect(endIndex).toBe(14);
  });

  it('should correctly resolve indexes and heights for static item sizes with enough scroll to go past the initial buffer', () => {
    const params = {
      scrollTop: 130,
      viewHeight: 300,
      itemSize: 30,
      totalItems: 100,
      itemBuffer: 3,
      dynamicSizes: {},
    };
    const {
      totalItemHeight,
      scrollTopPadding,
      startIndex,
      endIndex,
    } = resolveIndexes(params);

    expect(totalItemHeight).toBe(params.itemSize * params.totalItems);
    expect(startIndex).toBe(1);
    expect(scrollTopPadding).toBe(100);
    expect(endIndex).toBe(17);
  });


  
  it('tests dynamic sized items still get computed correctly', () => {
    const dynamicSizeItem = 150;
    const params = {
      scrollTop: 140,
      viewHeight: 300,
      itemSize: 30,
      totalItems: 100,
      itemBuffer: 3,
      dynamicSizes: {
        0: dynamicSizeItem,
      },
    };

    const {
      totalItemHeight,
      scrollTopPadding,
      
      startIndex,
      endIndex,
    } = resolveIndexes(params);

    expect(totalItemHeight).toBe(params.itemSize*(params.totalItems-1) + dynamicSizeItem);
    expect(startIndex).toBe(0);
    expect(scrollTopPadding).toBe(140);
    expect(endIndex).toBe(13);
  });
});