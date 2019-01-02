interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

// Comparison function to choose the best object
const compare = function(a: Area, b: Area) {
  return a.height * a.width > b.height * b.width;
};

// Don't ask how this works, use the article above if you must know
const maxRectangleRow = function(histogram: number[]) {
  const stack: Area[] = [];
  const top = function() { return stack[stack.length - 1]; };
  let max: Area = { height: 0, width: 0, x: -1, y: -1 };
  let height;
  let start;
  let item;
  let potential;
  let pos;

  for (pos = 0; pos < histogram.length; pos++) {
    height = histogram[pos];
    start = pos;

    while (true) {
      if (!stack.length || height > top().height) {
        stack.push({ height: height, width: 0, x: pos, y: -1 });
      }
      else if (stack.length > 0 && height < top().height) {
        potential = { height: top().height, width: pos - top().x, x: top().x, y: -1 };
        if (compare(potential, max)) {
          max = potential;
        }
        start = (stack.pop() as Area).x;
        continue;
      }
      break;
    }
  }

  for (start = 0; start < stack.length; start++) {
    item = stack[start];
    potential = { height: item.height, width: pos - item.x, x: item.x, y: -1 };
    if (compare(potential, max)) {
      max = potential;
    }
  }
  return max;
};

// Finds the maximum size rectangle in a grid with obstructing cells
// also accepts a constraints function which can apply additional constraints to the desired shape
// Implementation of:
// http://stackoverflow.com/questions/2478447/find-largest-rectangle-containing-only-zeros-in-an-n%C3%97n-binary-matrix#answer-4671342
export default function maxRectangle(matrix: number[][]) {
  let max: Area = { height: 0, width: 0, x: -1, y: -1 };
  let histogram = matrix[0].map(() => 0);
  matrix.map(function(row, y) {
    histogram = row.map(function(item, x) { return item ? 0 : histogram[x] + 1; });
    const potential = maxRectangleRow(histogram);
    if (compare(potential, max)) {
      potential.y = y - (potential.height - 1);
      max = potential;
    }
  });
  return max;
}
