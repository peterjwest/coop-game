import { Engine, Render, World, Body, Bodies, Mouse, MouseConstraint, Vector } from 'matter-js';

import { loadImageData, generateGrid, invertGrid } from './util/image';
import { computeRooms, computeRoomGraph, findPath } from './pathfinding';

loadImageData('./images/map.png').then(generateGrid).then((grid) => {
  const rooms = computeRooms(grid);
  const graph = computeRoomGraph(rooms);
  findPath({ x: 336, y: 336 }, { x: 24, y: 24 }, rooms, graph);

  const inverseGrid = invertGrid(grid);
  const walls = computeRooms(inverseGrid);
  const engine = Engine.create();
  const renderer = Render.create({
    element: document.body,
    engine: engine,
  });
  const wallBodies = walls.map((wall) => {
    return Bodies.rectangle(
      wall.area.x + wall.area.width / 2,
      wall.area.y + wall.area.height / 2,
      wall.area.width,
      wall.area.height,
      { isStatic: true },
    );
  });

  const height = grid.length;
  const width = grid[0].length;
  const borders = [
    Bodies.rectangle(-width * 0.05, height / 2, width * 0.1, height * 1.2, { isStatic: true }),
    Bodies.rectangle(width / 2, -height * 0.05, width * 1.2, height * 0.1, { isStatic: true }),
    Bodies.rectangle(width * 1.05, height / 2, width * 0.1, height * 1.2, { isStatic: true }),
    Bodies.rectangle(width / 2, height * 1.05, width * 1.2, height * 0.1, { isStatic: true }),
  ];

  const droneWidth = 10;
  const drone = Bodies.rectangle(50, 50, droneWidth * 1.2, droneWidth, {
    restitution: 0.6,
    slop: 0.5,
    friction: 0.1,
    frictionStatic: 0,
    frictionAir: 0.12,
    density: 0.15,
  });

  World.add(engine.world, wallBodies.concat(borders).concat([drone]));

  engine.world.gravity.y = 0;

  const mouse = Mouse.create(renderer.canvas);
  const mouseConstraint = MouseConstraint.create(engine, { mouse: mouse });
  World.add(engine.world, mouseConstraint);

  Engine.run(engine);
  Render.run(renderer);

  let forward = false;
  let back = false;
  let left = false;
  let right = false;

  document.body.addEventListener('keydown', function(e) {
    if (e.code === 'ArrowUp') { forward = true; }
    if (e.code === 'ArrowDown') { back = true; }
    if (e.code === 'ArrowLeft') { left = true; }
    if (e.code === 'ArrowRight') { right = true; }
    e.preventDefault();
  });

  document.body.addEventListener('keyup', function(e) {
    if (e.code === 'ArrowUp') { forward = false; }
    if (e.code === 'ArrowDown') { back = false; }
    if (e.code === 'ArrowLeft') { left = false; }
    if (e.code === 'ArrowRight') { right = false; }
    e.preventDefault();
  });

  function applyThrust(body: Body, thrust: number, offset: number) {
    const thrustPosition = Vector.add(body.position, Vector.rotate({ x: offset, y: 0 }, body.angle + Math.PI / 2));
    const thrustForce = Vector.rotate({ x: thrust, y: 0 }, body.angle);
    Body.applyForce(body, thrustPosition, thrustForce);
  }

  setInterval(() => {
    if (forward && left) {
      applyThrust(drone, 0.009, droneWidth / 2);
    } else if (forward && right) {
      applyThrust(drone, 0.009, -droneWidth / 2);
    } else if (back && left) {
      applyThrust(drone, -0.009, droneWidth / 2);
    } else if (back && right) {
      applyThrust(drone, -0.009, -droneWidth / 2);
    } else if (forward) {
      applyThrust(drone, 0.006, droneWidth / 2);
      applyThrust(drone, 0.006, -droneWidth / 2);
    } else if (back) {
      applyThrust(drone, -0.006, droneWidth / 2);
      applyThrust(drone, -0.006, -droneWidth / 2);
    } else if (left) {
      applyThrust(drone, 0.006, droneWidth / 2);
      applyThrust(drone, -0.006, -droneWidth / 2);
    } else if (right) {
      applyThrust(drone, -0.006, droneWidth / 2);
      applyThrust(drone, 0.006, -droneWidth / 2);
    }
  }, 1000 / 60);
});
