import { times } from 'lodash';
import { Engine, Render, World, Body, Bodies, Mouse, MouseConstraint, Vector } from 'matter-js';

import { loadImageData, generateGrid, invertGrid } from './util/image';
import { computeRooms, computeRoomGraph, findPath } from './pathfinding';

loadImageData('./images/map.png').then(generateGrid).then((grid) => {
  const rooms = computeRooms(grid);
  const graph = computeRoomGraph(rooms);
  const droneWidth = 12;

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

  const drones = times(100).map(() => {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * height);
    return Bodies.circle(x, y, droneWidth / 2, {
      restitution: 0.9,
      slop: 0.5,
      friction: 0.1,
      frictionStatic: 0,
      frictionAir: 0.12,
      density: 0.15,
    });
  });

  // const markers = path.map((node) => {
  //   const marker = Bodies.circle(node.x, node.y, droneWidth / 2);
  //   marker.isSensor = true;
  //   return marker;
  // });

  World.add(engine.world, wallBodies.concat(borders).concat(drones));

  engine.world.gravity.y = 0;

  const mouse = Mouse.create(renderer.canvas);
  const mouseConstraint = MouseConstraint.create(engine, { mouse: mouse });
  World.add(engine.world, mouseConstraint);

  Engine.run(engine);
  Render.run(renderer);

  // let up = false;
  // let down = false;
  // let left = false;
  // let right = false;

  // document.body.addEventListener('keydown', function(e) {
  //   if (e.code === 'ArrowUp') {
  //     up = true;
  //     e.preventDefault();
  //   }
  //   if (e.code === 'ArrowDown') {
  //     down = true;
  //     e.preventDefault();
  //   }
  //   if (e.code === 'ArrowLeft') {
  //     left = true;
  //     e.preventDefault();
  //   }
  //   if (e.code === 'ArrowRight') {
  //     right = true;
  //     e.preventDefault();
  //   }
  // });

  // document.body.addEventListener('keyup', function(e) {
  //   if (e.code === 'ArrowUp') {
  //     up = false;
  //     e.preventDefault();
  //   }
  //   if (e.code === 'ArrowDown') {
  //     down = false;
  //     e.preventDefault();
  //   }
  //   if (e.code === 'ArrowLeft') {
  //     left = false;
  //     e.preventDefault();
  //   }
  //   if (e.code === 'ArrowRight') {
  //     right = false;
  //     e.preventDefault();
  //   }
  // });

  function applyThrust(body: Body, thrust: number, angle: number) {
    const thrustForce = Vector.rotate({ x: thrust, y: 0 }, angle);
    Body.applyForce(body, body.position, thrustForce);
  }

  const indexes = drones.map(() => 0);
  const paths = drones.map((drone) => {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * height);
    try {
      return findPath({ x: drone.position.x, y: drone.position.y }, { x: x, y: y }, droneWidth, rooms, graph);
    } catch {
      return [];
    }
  });

  setInterval(() => {
    // if (up) {
    //   applyThrust(drone, 0.02, - Math.PI / 2);
    // }
    // if (down) {
    //   applyThrust(drone, 0.02, Math.PI / 2);
    // }
    // if (left) {
    //   applyThrust(drone, 0.02, Math.PI);
    // }
    // if (right) {
    //   applyThrust(drone, 0.02, 0);
    // }

    drones.map((drone, i) => {
      if (indexes[i] < paths[i].length) {
        const distance = Vector.sub(Vector.create(paths[i][indexes[i]].x, paths[i][indexes[i]].y), drone.position);
        const angle = Vector.angle(Vector.create(1, 0), distance);
        applyThrust(drone, 0.02, angle);

        if (Vector.magnitude(distance) < 6) {
          indexes[i]++;
        }
      }
    });

  }, 1000 / 60);
});
