import { last } from 'lodash';

export interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

// Comparison function to choose the best object
const compare = function(a: Area, b: Area) {
  return a.height * a.width > b.height * b.width;
};

// Don't ask how this works, use the article below if you must know
const maxRectangleRow = function(histogram: number[], y: number) {
  const stack: Area[] = [];
  let maxArea: Area = { height: 0, width: 0, x: 0, y: 0 };
  let x;

  for (x = 0; x < histogram.length; x++) {
    const height = histogram[x];
    let currentX = x;

    while (true) {
      const item = last(stack);
      if (!item || height > item.height) {
        stack.push({ height: height, width: 0, x: currentX, y: y - (height - 1) });
      }
      else if (item && height < item.height) {
        const area = { ...item, width: x - item.x };
        if (compare(area, maxArea)) {
          maxArea = area;
        }
        stack.pop();
        currentX = item.x;
        continue;
      }
      break;
    }
  }

  for (let start = 0; start < stack.length; start++) {
    const item = stack[start];
    const area = { ...item, width: x - item.x };
    if (compare(area, maxArea)) {
      maxArea = area;
    }
  }
  return maxArea;
};

// Finds the maximum size rectangle in a grid with obstructing cells
// also accepts a constraints function which can apply additional constraints to the desired shape
// Implementation of:
// http://stackoverflow.com/questions/2478447/find-largest-rectangle-containing-only-zeros-in-an-n%C3%97n-binary-matrix#answer-4671342
export default function maxRectangle(matrix: number[][]) {
  let max: Area = { height: 0, width: 0, x: -1, y: -1 };
  let histogram = matrix[0].map(() => 0);
  matrix.map(function(row, y) {
    histogram = row.map((hasWall, x) => hasWall ? 0 : histogram[x] + 1);
    const potential = maxRectangleRow(histogram, y);
    if (compare(potential, max)) {
      max = potential;
    }
  });
  return max.width * max.height > 0 ? max : undefined;
}
