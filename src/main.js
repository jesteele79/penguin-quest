import * as THREE from 'three';
import { G } from './core/state.js';
import { Input } from './core/input.js';
import { World } from './world/world.js';
import { Player } from './actors/player.js';
import { FollowCam } from './actors/camera.js';
import { LOC } from './world/layout.js';

function boot() {
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.3, 1400);

  const world = new World(scene, renderer);
  const player = new Player(scene, world);
  player.teleport(LOC.start.x, LOC.start.z, LOC.start.yaw);
  const input = new Input();
  input.attach(canvas);
  const cam = new FollowCam(camera, world.terrain);
  cam.snap(player);
  Object.assign(G, { renderer, scene, camera, world, player, input, cam, terrain: world.terrain });
  window.__pq = {
    G, THREE,
    tp(x, z, yaw = player.yaw) { player.teleport(x, z, yaw); cam.snap(player); },
    shot(px, py, pz, tx, ty, tz) { cam.setShot({ pos: new THREE.Vector3(px, py, pz), look: new THREE.Vector3(tx, ty, tz) }, 0.01); },
    free() { cam.release(0.01); },
  };

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  const timer = new THREE.Timer();
  timer.connect(document);
  let time = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    timer.update(ts);
    const dt = Math.min(timer.getDelta(), 1 / 20);
    time += dt;
    G.time = time;
    player.update(dt, input);
    for (const e of player.takeEvents()) {
      if (e.type === 'step' && !e.platform) world.effects.footprint(player.pos.x, player.pos.z, player.yaw);
      if (e.type === 'splash') world.effects.splash(player.pos, 1);
      if (e.type === 'land') world.effects.snowSpray(player.pos, 0, 0, 3);
    }
    if (player.sliding) world.effects.snowSpray(player.pos, Math.sin(player.yaw) * player.speed, Math.cos(player.yaw) * player.speed, 0.6);
    cam.update(dt, player, input);
    world.update(dt, time, camera, player.pos);
    world.roads.update(time, dt, player.pos, true, renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)));
    renderer.render(scene, camera);
    input.endFrame();
  }
  requestAnimationFrame(frame);
  world.roads.setTarget({ x: -52, z: -4 });
  document.getElementById('boot').classList.add('gone');
}

boot();
