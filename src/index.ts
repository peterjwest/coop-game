import { clone } from 'lodash';
import { Grid, JumpPointFinder, Util } from 'pathfinding';
import { aStar } from 'ngraph.path';
import * as createGraph from 'ngraph.graph';
import { Graph } from 'ngraph.graph';

import maxRectangle, { Area } from './util/max-rectangle';

interface Point {
  x: number;
  y: number;
}

interface Connection {
  start: Point;
  end: Point;
  ids: number[];
}

interface Room {
  id: number;
  area: Area;
  connections: Connection[];
}

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
  return grid;
}

loadImageData('./images/map-subsample.png').then(generateGrid).then((rawGrid) => {
  const grid = new Grid(rawGrid);
  const finder = JumpPointFinder({});

  const start: Point = { x: 96 / 8, y: 96 / 8 };
  const end: Point = { x: 328 / 8, y: 328 / 8 };

  const rawPath = finder.findPath(start.x, start.y, end.x, end.y, grid.clone());
  const path = Util.smoothenPath(grid, rawPath);
  console.log(path);

  const rooms = computeRooms(rawGrid);
  console.log(rooms);
  const graph = computeRoomGraph(rooms);

  const pathFinder = aStar(graph);
  console.log(pathFinder.find('1-28', '13-21').map((x) => x.data));
});

function computeRooms(grid: number[][]): Room[] {
  const roomAreas = [];
  const gridCopy = clone(grid);
  while (true) {
    const rectangle = maxRectangle(gridCopy);
    if (!rectangle) {
      break;
    }
    for (let x = 0; x < rectangle.width; x++) {
      for (let y = 0; y < rectangle.height; y++) {
        gridCopy[y + rectangle.y][x + rectangle.x] = 1;
      }
    }
    roomAreas.push(rectangle);
  }
  const rooms = roomAreas.map((area, i) => ({ id: i, area: area, connections: [] }));

  return rooms.map((room) => {
    const connections = rooms.map((room2) => {
      if (room !== room2) {
        return getRoomConnection(room, room2);
      }
    }).filter((connection): connection is Connection => Boolean(connection));
    return { ...room, connections: connections };
  });
}

function connectionId(connection: Connection) {
  return connection.ids.join('-');
}

export function computeRoomGraph(rooms: Room[]) {
  const graph: Graph = (createGraph as any)();

  rooms.map((room) => {
    room.connections.map((connection) => {
      graph.addNode(connectionId(connection), { ...connection.start, connection: connection } as any);
      room.connections.map((connection2) => {
        if (connection !== connection2) {
          graph.addLink(connectionId(connection), connectionId(connection2));
        }
      });
    });
  });

  return graph;
}

function getAdjacentPoint(a: Area, b: Area, axis: 'x' | 'y') {
  const dimension = axis === 'x' ? 'width' : 'height';
  if (a[axis] + a[dimension] === b[axis]) {
    return (2 * b[axis] - 1) / 2;
  }
  if (b[axis] + b[dimension] === a[axis]) {
    return (2 * a[axis] - 1) / 2;
  }
}

function getOverlap(a: Area, b: Area, axis: 'x' | 'y'): [number, number] | undefined {
  const dimension = axis === 'x' ? 'width' : 'height';
  const start = Math.max(a[axis], b[axis]);
  const end = Math.min(a[axis] + a[dimension] - 1, b[axis] + b[dimension] - 1);
  if (end >= start) {
    return [start, end];
  }
}

function getRoomConnection(a: Room, b: Room): Connection | undefined {
  const adjacentX = getAdjacentPoint(a.area, b.area, 'x');
  const overlapY = getOverlap(a.area, b.area, 'y');
  if (adjacentX !== undefined && overlapY) {
    return {
      start: { x: adjacentX, y: overlapY[0] },
      end: { x: adjacentX, y: overlapY[1] },
      ids: [a.id, b.id].sort(),
    };
  }

  const adjacentY = getAdjacentPoint(a.area, b.area, 'y');
  const overlapX = getOverlap(a.area, b.area, 'x');
  if (adjacentY !== undefined && overlapX) {
    return {
      start: { x: overlapX[0], y: adjacentY },
      end: { x: overlapX[1], y: adjacentY },
      ids: [a.id, b.id].sort(),
    };
  }
}

