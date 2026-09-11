/* 3D DNA double helix behind the scattered menu.
   Shown only while the menu is in scatter mode; the render loop sleeps otherwise. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('helixCanvas');
const menu = document.getElementById('menuScreen');

if (canvas && menu) {
    try {
        start();
    } catch (err) {
        console.warn('[helix] WebGL unavailable', err);
        canvas.remove();
    }
}

function start() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    // Far turns melt into the white page, which is what sells the depth
    scene.fog = new THREE.Fog(0xffffff, 22.5, 34);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 24);

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-7, 9, 12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc8f7ea, 1.1);
    rim.position.set(9, -5, -8);
    scene.add(rim);

    /* ----- geometry ----- */
    const R = 1.75;             // helix radius
    const BP_PER_TURN = 10;
    const RISE = 0.56;          // height per base pair
    const TURNS = 8;
    const GROOVE = 2.4;         // angle between strands (rad) → major / minor grooves
    const count = BP_PER_TURN * TURNS;
    const twist = (Math.PI * 2) / BP_PER_TURN;
    const y0 = -(count - 1) * RISE / 2;

    function strandPoint(i, offset, out) {
        const a = i * twist + offset;
        return out.set(Math.cos(a) * R, y0 + i * RISE, Math.sin(a) * R);
    }

    const glossy = (color, extra) => new THREE.MeshPhysicalMaterial(Object.assign({
        color, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08
    }, extra || {}));

    const helix = new THREE.Group();   // spins about its own axis
    const tilt = new THREE.Group();    // leans the whole strand across the frame
    tilt.add(helix);
    scene.add(tilt);

    // Backbones: smooth tubes following each strand
    const backboneMat = glossy(0x17804f);
    [0, GROOVE].forEach(offset => {
        const pts = [];
        const sub = 6;
        for (let s = -sub; s <= (count - 1) * sub + sub; s++) {
            pts.push(strandPoint(s / sub, offset, new THREE.Vector3()));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.TubeGeometry(curve, count * 10, 0.17, 20, false);
        helix.add(new THREE.Mesh(tube, backboneMat));
    });

    // Phosphate knots where each base leaves the backbone
    const knotGeo = new THREE.SphereGeometry(0.3, 28, 20);
    const knots = new THREE.InstancedMesh(knotGeo, glossy(0x00a88f, { roughness: 0.2 }), count * 2);

    // Base-pair rungs: two halves that meet near the middle, coloured by base
    const rungGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 18, 1, false);
    const rungs = new THREE.InstancedMesh(rungGeo, glossy(0xffffff, { roughness: 0.34 }), count * 2);
    const capGeo = new THREE.SphereGeometry(0.12, 18, 12);
    const caps = new THREE.InstancedMesh(capGeo, glossy(0xffffff, { roughness: 0.34 }), count * 2);

    const BASE = {
        A: new THREE.Color(0x1b6b31),
        T: new THREE.Color(0x8fd46f),
        G: new THREE.Color(0x00a88f),
        C: new THREE.Color(0xa9e8d8)
    };
    const PAIRS = [['A', 'T'], ['T', 'A'], ['G', 'C'], ['C', 'G']];

    // Fixed seed so the sequence is the same on every visit
    let seed = 20250101;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

    const pA = new THREE.Vector3(), pB = new THREE.Vector3();
    const mid = new THREE.Vector3(), dir = new THREE.Vector3(), end = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
        strandPoint(i, 0, pA);
        strandPoint(i, GROOVE, pB);
        mid.copy(pA).add(pB).multiplyScalar(0.5);
        const pair = PAIRS[Math.floor(rnd() * 4)];

        [[pA, pair[0]], [pB, pair[1]]].forEach(([from, base], side) => {
            const idx = i * 2 + side;

            m.makeTranslation(from.x, from.y, from.z);
            knots.setMatrixAt(idx, m);

            // stop just short of the midpoint so the pairing reads
            dir.copy(mid).sub(from);
            const len = dir.length() - 0.05;
            dir.normalize();
            end.copy(from).addScaledVector(dir, len);

            q.setFromUnitVectors(up, dir);
            sc.set(1, len, 1);
            m.compose(from.clone().add(end).multiplyScalar(0.5), q, sc);
            rungs.setMatrixAt(idx, m);
            rungs.setColorAt(idx, BASE[base]);

            m.makeTranslation(end.x, end.y, end.z);
            caps.setMatrixAt(idx, m);
            caps.setColorAt(idx, BASE[base]);
        });
    }
    helix.add(knots, rungs, caps);

    /* ----- framing ----- */
    const TILT_Z = -0.36;
    const TILT_X = 0.2;

    function layout() {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        const halfW = halfH * camera.aspect;
        const narrow = w < 769;
        tilt.position.x = halfW * (narrow ? 0.5 : 0.52);
        tilt.scale.setScalar(narrow ? 0.62 : THREE.MathUtils.clamp(camera.aspect / 1.6, 0.8, 1.08));
        if (!running) renderer.render(scene, camera);
    }

    /* ----- motion ----- */
    const clock = new THREE.Clock();
    let running = false;
    let visible = false;
    let hideTimer = 0;
    let arrive = reduced ? 1 : 0;
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };

    window.addEventListener('pointermove', e => {
        pointer.x = e.clientX / window.innerWidth * 2 - 1;
        pointer.y = e.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });

    function pose(dt) {
        const k = 1 - Math.pow(1 - arrive, 3);
        helix.rotation.y += dt * (0.16 + (1 - k) * 1.1);   // spins in, then settles
        tilt.position.y = (1 - k) * -3;
        eased.x += (pointer.x - eased.x) * Math.min(dt * 2, 1);
        eased.y += (pointer.y - eased.y) * Math.min(dt * 2, 1);
        tilt.rotation.z = TILT_Z + eased.x * 0.05;
        tilt.rotation.x = TILT_X + eased.y * 0.07;
    }

    function frame() {
        if (!running) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        arrive = Math.min(arrive + dt / 2.4, 1);
        pose(dt);
        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    }

    function play() {
        if (reduced) {
            pose(0);
            renderer.render(scene, camera);
            return;
        }
        if (running) return;
        running = true;
        clock.getDelta();
        requestAnimationFrame(frame);
    }

    function stop() { running = false; }

    function sync() {
        const show = menu.classList.contains('active') && menu.dataset.mode === 'scatter';
        if (show === visible) return;
        visible = show;
        canvas.classList.toggle('show', show);
        clearTimeout(hideTimer);
        if (show) play();
        else hideTimer = setTimeout(stop, 1000);   // let the fade finish first
    }

    new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class', 'data-mode'] });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (visible) play();
    });
    window.addEventListener('resize', layout);

    pose(0);
    layout();
    renderer.compile(scene, camera);   // warm shaders during the intro
    sync();
}
