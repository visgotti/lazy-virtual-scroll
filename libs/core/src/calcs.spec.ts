import { fillItemArray, mergeAdjacentDatasets, resolveIndexes } from './calcs'; // Adjust the import according to your file structure

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

type Dataset = {
  startingIndex: number;
  data: Array<any>;
};
describe('fillItemArray', () => {
  it('should fill the array with data items within the visible range', () => {
    const orderedDatasets: Dataset[] = [
      { startingIndex: 0, data: ['a', 'b', 'c'] },
      { startingIndex: 3, data: ['d', 'e', 'f'] },
    ];
    const startIndex = 1;
    const endIndex = 4;

    const result = fillItemArray({ orderedDatasets, startIndex, endIndex });

    expect(result).toEqual(['b', 'c', 'd', 'e']);
  });

  it('should return an array filled with nulls if no data items fall within the visible range', () => {
    const orderedDatasets: Dataset[] = [
      { startingIndex: 0, data: ['a', 'b', 'c'] },
      { startingIndex: 3, data: ['d', 'e', 'f'] },
    ];
    const startIndex = 6;
    const endIndex = 8;

    const result = fillItemArray({ orderedDatasets, startIndex, endIndex });

    expect(result).toEqual([null, null, null]);
  });

  it('should partially fill the array if some data items fall within the visible range', () => {
    const orderedDatasets: Dataset[] = [
      { startingIndex: 0, data: ['a', 'b', 'c'] },
      { startingIndex: 3, data: ['d', 'e', 'f'] },
    ];
    const startIndex = 2;
    const endIndex = 5;

    const result = fillItemArray({ orderedDatasets, startIndex, endIndex });

    expect(result).toEqual(['c', 'd', 'e', 'f']);
  });
});



describe('mergeAdjacentDatasets', () => {
  it('sorts and merges the adjacent datasets', () => {

    const datasets: Dataset[] = [
      { startingIndex: 10, data: Array.from({ length: 20 }).fill(null) },
      { startingIndex: 8, data: Array.from({ length: 30 }).fill(null) },
      { startingIndex: 6, data: Array.from({ length: 12 }).fill(null) },
      { startingIndex: 5, data: Array.from({ length: 10 }).fill(null) },
      { startingIndex: 10, data: Array.from({ length: 25 }).fill(null) },
    ];
    const output = mergeAdjacentDatasets(datasets);
    expect(output.length).toEqual(1);
    expect(output[0].startingIndex).toEqual(5);
    expect(output[0].data.length).toEqual(33);

    const datasets2: Dataset[] = [
      { startingIndex: 0, data: Array.from({ length: 20 }).fill(null) },
      { startingIndex: 20, data: Array.from({ length: 30 }).fill(null) },
    ];
    const output2 = mergeAdjacentDatasets(datasets2);
    expect(output2.length).toEqual(1);
    expect(output2[0].startingIndex).toEqual(0);
    expect(output2[0].data.length).toEqual(50);

  });

  it('will not merge the non adjacent datasets', () => {

    const datasets: Dataset[] = [
      { startingIndex: 10, data: Array.from({ length: 20 }).fill(null) },
      { startingIndex: 8, data: Array.from({ length: 30 }).fill(null) },
      { startingIndex: 45, data: Array.from({ length: 12 }).fill(null) },
      { startingIndex: 6, data: Array.from({ length: 12 }).fill(null) },
      { startingIndex: 5, data: Array.from({ length: 10 }).fill(null) },
      { startingIndex: 10, data: Array.from({ length: 25 }).fill(null) },
      { startingIndex: 40, data: Array.from({ length: 30 }) },
      { startingIndex: 42, data: Array.from({ length: 35 }).fill(null) },
      { startingIndex: 39, data: Array.from({ length: 20 }).fill(null) },
    ];
    const output = mergeAdjacentDatasets(datasets);
    console.log('pout was', output);
    expect(output.length).toEqual(2);
    expect(output[0].startingIndex).toEqual(5);
    expect(output[0].data.length).toEqual(33);

    expect(output[1].startingIndex).toEqual(39);
    // 77 (max startingIndex + length, second to last item array should go to the highest index)
    // and 39 is the lowest starting index for second array
    expect(output[1].data.length).toEqual(77-39);
  });
})