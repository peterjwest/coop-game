import { cloneDeep, reverse } from 'lodash';
import * as createGraph from 'ngraph.graph';
import { Graph } from 'ngraph.graph';
import { aStar } from 'ngraph.path';

import maxRectangle, { Area } from './util/max-rectangle';

export interface Room {
  id: number;
  area: Area;
  connections: Connection[];
}

export interface Connection {
  start: Point;
  end: Point;
  ids: number[];
}

export interface Point {
  x: number;
  y: number;
}

export interface RoomNode extends Point {
  room: Room;
}

export interface ConnectionNode extends Point {
  connection: Connection;
}

export function connectionId(connection: Connection) {
  return connection.ids.join('-');
}

export function computeRooms(grid: number[][]): Room[] {
  const roomAreas = [];
  const gridCopy = cloneDeep(grid);
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

export function computeRoomGraph(rooms: Room[]) {
  const graph: Graph = (createGraph as any)();

  rooms.map((room) => {
    room.connections.map((connection) => {
      graph.addNode(connectionId(connection), {
        x: (connection.start.x + connection.end.x) / 2,
        y: (connection.start.y + connection.end.y) / 2,
        connection: connection,
      } as any);
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

export function findCurrentRoom(point: Point, rooms: Room[]) {
  return rooms.find((room) => (
    point.x >= room.area.x && point.x < room.area.x + room.area.width &&
    point.y >= room.area.y && point.y < room.area.y + room.area.height
  ));
}

export function findPath(start: Point, end: Point, rooms: Room[], graph: Graph) {
  const startRoom = findCurrentRoom(start, rooms);
  const endRoom = findCurrentRoom(end, rooms);
  if (!startRoom || !endRoom) {
    throw new Error('Cannot find a path from outside the level');
  }

  addPointToGraph('start', start, startRoom, graph);
  addPointToGraph('end', end, endRoom, graph);

  const pathFinder = aStar(graph);
  const path: Array<RoomNode | ConnectionNode> = reverse(pathFinder.find('start', 'end').map((node) => node.data));

  graph.removeNode('start');
  graph.removeNode('end');

  return optimisePath(path);
}

// Adjusts paths
function optimisePath(path: Array<RoomNode | ConnectionNode>) {
  return path.map((b, i) => {
    const a = path[i - 1];
    const c = path[i + 1];
    if (!a || !c || !('connection' in b)) {
      return b;
    }

    const slope = (c.y - a.y) / (c.x - a.x);
    const intercept = a.y - slope * a.x;

    // Vertical connection
    if (b.connection.start.x === b.connection.end.x) {
      const y = slope * b.x + intercept;
      return { ...b, y: Math.min(b.connection.end.y, Math.max(b.connection.start.y, y)) };
    }
    // Horizontal connection
    else {
      const x = (b.y - intercept) / slope;
      return { ...b, x: Math.min(b.connection.end.x, Math.max(b.connection.start.x, x)) };
    }
  });
}

function addPointToGraph(name: string, point: Point, room: Room, graph: Graph) {
  graph.addNode(name, { x: point.x, y: point.y, room: room } as any);
  room.connections.forEach((connection) => graph.addLink(name, connectionId(connection)));
}
