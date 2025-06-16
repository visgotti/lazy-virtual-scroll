import { Dataset } from "../types";
import { fillAndFlattenDatasets,  mergeAdjacentDatasets} from "./dataset";

describe('fillAndFlattenDatasets', () => {
  it('should fill the array with data items within the visible range', () => {
    const orderedDatasets: Dataset[] = [
      { startingIndex: 0, data: ['a', 'b', 'c'] },
      { startingIndex: 3, data: ['d', 'e', 'f'] },
    ];
    const startIndex = 1;
    const endIndex = 4;

    const result = fillAndFlattenDatasets({ orderedDatasets, startIndex, endIndex });

    expect(result).toEqual(['b', 'c', 'd', 'e']);
  });

  it('should return an array filled with nulls if no data items fall within the visible range', () => {
    const orderedDatasets: Dataset[] = [
      { startingIndex: 0, data: ['a', 'b', 'c'] },
      { startingIndex: 3, data: ['d', 'e', 'f'] },
    ];
    const startIndex = 6;
    const endIndex = 8;

    const result = fillAndFlattenDatasets({ orderedDatasets, startIndex, endIndex });

    expect(result).toEqual([null, null, null]);
  });

  it('should partially fill the array if some data items fall within the visible range', () => {
    const orderedDatasets: Dataset[] = [
      { startingIndex: 0, data: ['a', 'b', 'c'] },
      { startingIndex: 3, data: ['d', 'e', 'f'] },
    ];
    const startIndex = 2;
    const endIndex = 5;

    const result = fillAndFlattenDatasets({ orderedDatasets, startIndex, endIndex });

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