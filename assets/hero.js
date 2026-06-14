// AgentMetal hero — a lattice of VMs booting in provisioning waves.
// Instanced cubes, per-instance emissive flicker, pointer parallax.
import * as THREE from 'three';

const canvas = document.getElementById('lattice');
if (canvas) init(canvas);

function init(canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060807, 0.026);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(10, 4.5, 26);

  // ---- the lattice -------------------------------------------------------
  const GX = 18, GY = 9, GZ = 18, GAP = 2.05;
  const cells = [];
  // deterministic pseudo-random so the composition is art-directed, not noisy
  let seed = 1337;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  for (let x = 0; x < GX; x++)
    for (let y = 0; y < GY; y++)
      for (let z = 0; z < GZ; z++) {
        // sparse occupancy, denser toward a diagonal "spine"
        const cx = x - GX / 2 + 0.5, cy = y - GY / 2 + 0.5, cz = z - GZ / 2 + 0.5;
        const spine = Math.abs(cx * 0.5 + cz * 0.5 - cy) / 8;
        if (rand() > 0.34 - spine * 0.18) continue;
        cells.push({
          pos: new THREE.Vector3(cx * GAP, cy * GAP, cz * GAP),
          phase: rand() * Math.PI * 2,
          rate: 0.4 + rand() * 1.4,
          hot: rand() < 0.16, // a few amber "renewal due" boxes
        });
      }

  const geo = new THREE.BoxGeometry(0.78, 0.78, 0.78);
  const mat = new THREE.MeshBasicMaterial({ vertexColors: false });
  mat.onBeforeCompile = () => {}; // keep basic
  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cells.length * 3), 3);
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();
  cells.forEach((c, i) => {
    dummy.position.copy(c.pos);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });

  const group = new THREE.Group();
  group.add(mesh);

  // wire shell around the lattice — the "datacenter" boundary
  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(GX * GAP, GY * GAP, GZ * GAP)),
    new THREE.LineBasicMaterial({ color: 0x34f5a2, transparent: true, opacity: 0.1 })
  );
  group.add(shell);

  // drifting dust
  const dustN = 260;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN * 3; i++) dustPos[i] = (rand() - 0.5) * 70;
  const dust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dustPos, 3)),
    new THREE.PointsMaterial({ color: 0x34f5a2, size: 0.07, transparent: true, opacity: 0.35, sizeAttenuation: true })
  );
  group.add(dust);
  scene.add(group);

  // ---- colors ------------------------------------------------------------
  const C_DIM = new THREE.Color(0x121b16);
  const C_MID = new THREE.Color(0x1d3328);
  const C_GRN = new THREE.Color(0x34f5a2);
  const C_AMB = new THREE.Color(0xffb454);
  const tmp = new THREE.Color();

  function paint(t) {
    // a provisioning wave sweeps along the diagonal; individual boots flicker on top
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const wave = Math.sin(t * 0.9 - (c.pos.x + c.pos.z) * 0.22 + c.pos.y * 0.1);
      const boot = Math.max(0, Math.sin(t * c.rate + c.phase));
      const k = Math.max(0, wave) * 0.55 + boot * boot * boot * 0.6;
      tmp.copy(C_DIM).lerp(C_MID, Math.min(1, k * 1.4));
      if (k > 0.62) tmp.lerp(c.hot ? C_AMB : C_GRN, (k - 0.62) * 2.2);
      mesh.setColorAt(i, tmp);
    }
    mesh.instanceColor.needsUpdate = true;
  }

  // ---- pointer parallax ----------------------------------------------------
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    ptr.tx = (e.clientX / innerWidth - 0.5) * 2;
    ptr.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  // ---- sizing --------------------------------------------------------------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  addEventListener('resize', resize, { passive: true });

  // ---- loop ----------------------------------------------------------------
  const clock = new THREE.Clock();
  let raf = null;

  function frame() {
    raf = requestAnimationFrame(frame);
    resize();
    const t = clock.getElapsedTime();

    ptr.x += (ptr.tx - ptr.x) * 0.04;
    ptr.y += (ptr.ty - ptr.y) * 0.04;

    group.rotation.y = t * 0.05 + ptr.x * 0.14;
    group.rotation.x = -0.12 + ptr.y * 0.08;
    camera.position.x = 10 + ptr.x * 1.2;
    camera.position.y = 4.5 - ptr.y * 1.0;
    camera.lookAt(0, 0, 0);

    dust.rotation.y = -t * 0.012;
    paint(t);
    renderer.render(scene, camera);
  }

  if (reduced) {
    // single art-directed still frame, no animation loop
    resize();
    paint(2.4);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    return;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { clock.getDelta(); frame(); }
  });

  frame();
}
