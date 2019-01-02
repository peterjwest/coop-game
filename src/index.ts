import { Grid, JumpPointFinder, Util } from 'pathfinding';

type Coord = [number, number];

async function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = function() {
      resolve(image);
    };
    image.onerror = function(error) {
      reject(error);
    };
  });
}

async function loadImageData(url: string) {
  const image = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not access canvas context');
  }
  context.drawImage(image, 0, 0, image.width, image.height);
  return context.getImageData(0, 0, image.width, image.height);
}

function generateGrid(imageData: ImageData) {
  const grid: number[][] = (
    new Array(imageData.height)
    .fill(undefined)
    .map(() => new Array(imageData.width))
  );
  for (let n = 0; n * 4 < imageData.data.length; n++) {
    const x = n % imageData.width;
    const y = Math.floor(n / imageData.width);
    grid[y][x] = imageData.data[n * 4] === 0 ? 1 : 0;
  }
  return new Grid(grid);
}

loadImageData('./images/map-subsample.png').then(generateGrid).then((grid) => {
  const finder = JumpPointFinder({});

  const start: Coord = [96 / 8, 96 / 8];
  const end: Coord = [328 / 8, 328 / 8];

  let path;
  for (let i = 0; i < 500; i++) {
    const rawPath = finder.findPath(start[0], start[1], end[0], end[1], grid.clone());
    path = Util.smoothenPath(grid, rawPath);
  }
  console.log(path);
});
