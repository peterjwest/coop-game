import { loadImageData, generateGrid, invertGrid } from './util/image';
import { computeRooms, computeRoomGraph, findPath } from './pathfinding';

loadImageData('./images/map.png').then(generateGrid).then((grid) => {
  const rooms = computeRooms(grid);
  const graph = computeRoomGraph(rooms);
  findPath({ x: 336, y: 336 }, { x: 24, y: 24 }, rooms, graph);

});

