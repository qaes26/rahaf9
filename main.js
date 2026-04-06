import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

// Configuration
const config = {
  citySize: 50,
  buildingCount: 300,
  nightColor: 0x050510,
  neonColors: [0x00ffcc, 0xda00ff, 0x3366ff, 0xff3366],
};

// Media items (videos and images) organized dynamically
const mediaFiles = [
  'WhatsApp Image 2026-04-06 at 9.52.17 PM.jpeg',
  'WhatsApp Video 2026-04-06 at 10.16.18 PM.mp4',
  'WhatsApp Video 2026-04-06 at 10.16.19 PM (1).mp4',
  'WhatsApp Video 2026-04-06 at 10.16.19 PM (2).mp4',
  'WhatsApp Video 2026-04-06 at 10.16.19 PM (3).mp4',
  'WhatsApp Video 2026-04-06 at 10.16.19 PM.mp4',
  'WhatsApp Video 2026-04-06 at 9.51.44 PM.mp4',
  'WhatsApp Video 2026-04-06 at 9.52.20 PM.mp4',
  'WhatsApp Video 2026-04-06 at 9.52.21 PM.mp4'
];

const mediaItems = mediaFiles.map(file => ({
  type: file.endsWith('.mp4') ? 'video' : 'image',
  src: './' + file
}));

let scene, camera, renderer, composer, controls;
let videoElements = [];
let isAutoPilot = true;
let cameraTimeline;
let targetLookAt = new THREE.Vector3(0, 10, 0); 

const ghazalPhrases = [
  "رهف.. يا وجه القمر الذي لا يغيب",
  "في عيونك ألف قصة حب",
  "جمالك ينسينا تعب الأيام",
  "أنتِ المدينة وأنتِ سكانها",
  "سحر عينيكِ فاق كل الخيال",
  "رهف.. نجمتي التي تضيء عالمي"
];

init();
animate();

function init() {
  console.log("Initializing 3D City World...");
  
  // 1. Setup Scene
  const canvas = document.querySelector('#webgl');
  if(!canvas) return;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(config.nightColor);
  scene.fog = new THREE.FogExp2(config.nightColor, 0.02);

  // 2. Setup Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 15, 50); 
  targetLookAt = new THREE.Vector3(0, 10, 0);

  // 3. Setup Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 4. Post-processing
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.2;
  bloomPass.strength = 1.2;
  bloomPass.radius = 0.5;

  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // 5. Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.enabled = false; 

  // 6. Lights
  const ambientLight = new THREE.AmbientLight(0x222233, 1.5);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x5555aa, 1.5);
  moonLight.position.set(-10, 20, -10);
  scene.add(moonLight);

  // 7. Create Environment
  createGround();
  generateCity();

  // 8. Setup UI Events
  setupUI();

  // Resize handler
  window.addEventListener('resize', onWindowResize);
}

function createGround() {
  const planeGeometry = new THREE.PlaneGeometry(150, 150);
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#111122';
  for(let i=0; i<=512; i+=32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(15, 15);

  const planeMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.2, metalness: 0.8 });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);
}

function createWindowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#101015';
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 256; y += 20) {
    for (let x = 10; x < 128; x += 16) {
      if (Math.random() > 0.6) { 
        ctx.fillStyle = Math.random() > 0.5 ? '#f5e4c3' : '#c9eaf2';
        ctx.fillRect(x, y, 10, 12);
      }
    }
  }
  return new THREE.CanvasTexture(canvas);
}

function generateCity() {
  const winTex = createWindowTexture();
  
  for (let i = 0; i < config.buildingCount; i++) {
    const w = 2 + Math.random() * 4;
    const h = 5 + Math.random() * 25;
    const d = 2 + Math.random() * 4;
    
    let x, z;
    let attempts = 0;
    do {
      x = (Math.random() - 0.5) * 120;
      z = (Math.random() - 0.5) * 120;
      attempts++;
    } while (Math.sqrt(x*x + z*z) < 35 && attempts < 100);
    
    const geometry = new THREE.BoxGeometry(w, h, d);
    const tex = winTex.clone(); tex.repeat.set(w * 0.5, h * 0.4);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x111115, 
      map: tex, 
      emissiveMap: tex, 
      emissive: 0xffffff, 
      emissiveIntensity: 0.5 
    });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, h/2, z);
    scene.add(building);
  }

  createMediaTowers();
  createGhazalPanels();
  createHearts();
}

function createHearts() {
  const geometry = new THREE.BufferGeometry();
  const count = 300;
  const positions = new Float32Array(count * 3);
  for(let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 150;
    positions[i+1] = Math.random() * 60;
    positions[i+2] = (Math.random() - 0.5) * 150;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xff3366, size: 0.8, transparent: true, opacity: 0.6 });
  const hearts = new THREE.Points(geometry, material);
  scene.add(hearts);

  const proxy = { y: 0 };
  gsap.to(proxy, { y: 100, duration: 20, repeat: -1, ease: "none", onUpdate: () => {
    for(let i=1; i<positions.length; i+=3) {
      positions[i] += 0.05;
      if(positions[i] > 60) positions[i] = 0;
    }
    geometry.attributes.position.needsUpdate = true;
  }});
}

function createGhazalPanels() {
  const arcSpread = Math.PI * 0.9;
  const radius = 26;
  ghazalPhrases.forEach((phrase, index) => {
    const angle = -arcSpread / 2 + (index / (ghazalPhrases.length - 1)) * arcSpread;
    const x = Math.sin(angle) * (radius + index % 2 * 2);
    const z = -Math.cos(angle) * (radius + index % 2 * 2);
    const y = 8 + Math.random() * 8;

    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.font = '700 75px Tajawal'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#da00ff';
    ctx.fillText(phrase, 512, 128);
    
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), new THREE.MeshBasicMaterial({ 
      map: new THREE.CanvasTexture(canvas), transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide 
    }));
    panel.position.set(x, y, z);
    panel.rotation.y = -angle;
    gsap.to(panel.position, { y: y + 2, duration: 3 + Math.random()*2, repeat: -1, yoyo: true, ease: "sine.inOut" });
    scene.add(panel);
  });
}

function createMediaTowers() {
  const arcSpread = Math.PI * 0.8;
  const radius = 22;
  mediaItems.forEach((item, index) => {
    const angle = -arcSpread / 2 + (index / (mediaItems.length - 1)) * arcSpread;
    const pos = { x: Math.sin(angle) * radius, z: -Math.cos(angle) * radius, rot: -angle };
    let texture;
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.src; video.crossOrigin = 'anonymous'; video.loop = true;
      video.muted = index !== 0; 
      video.volume = 1.0; video.playsInline = true; video.style.display = 'none';
      document.body.appendChild(video);
      videoElements.push(video);
      texture = new THREE.VideoTexture(video);
    } else {
      texture = new THREE.TextureLoader().load(item.src);
    }
    
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: texture });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(10, 22, 1), [sideMat, sideMat, sideMat, sideMat, mat, mat]);
    tower.position.set(pos.x, 11, pos.z);
    tower.rotation.y = pos.rot;
    scene.add(tower);

    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(tower.geometry), new THREE.LineBasicMaterial({ color: 0x00ffcc }));
    tower.add(frame);
  });
}

function setupUI() {
  const overlay = document.getElementById('ui-overlay');
  const startBtn = document.getElementById('start-btn');
  const hud = document.getElementById('hud');
  
  if(!startBtn) return;
  
  startBtn.addEventListener('click', () => {
    console.log("Start button clicked, hiding overlay...");
    overlay.classList.add('hidden');
    hud.classList.remove('hidden');
    videoElements.forEach(v => v.play().catch(e => console.log("Video play failed:", e)));
    startAutoPilot();
  });

  document.getElementById('auto-pilot-btn')?.addEventListener('click', () => {
    isAutoPilot = true;
    controls.enabled = false;
    startAutoPilot();
  });
  document.getElementById('manual-btn')?.addEventListener('click', () => {
    isAutoPilot = false;
    controls.enabled = true;
    if(cameraTimeline) cameraTimeline.pause();
  });
}

function startAutoPilot() {
  if(!isAutoPilot) return;
  if(cameraTimeline) cameraTimeline.kill();
  cameraTimeline = gsap.timeline({ repeat: -1 });
  
  const arcSpread = Math.PI * 0.8;
  const radius = 22;

  cameraTimeline.to(camera.position, { x: 0, y: 15, z: 50, duration: 5, ease: "power2.inOut" });
  cameraTimeline.to(targetLookAt, { x: 0, y: 10, z: 0, duration: 2 }, "<");

  mediaItems.forEach((item, index) => {
    const angle = -arcSpread / 2 + (index / (mediaItems.length - 1)) * arcSpread;
    const camRadius = radius + 16;
    cameraTimeline.to(camera.position, {
      x: Math.sin(angle) * camRadius, y: 12, z: -Math.cos(angle) * camRadius,
      duration: 6, ease: "power1.inOut"
    });
    cameraTimeline.to(targetLookAt, {
      x: Math.sin(angle) * radius, y: 11, z: -Math.cos(angle) * radius,
      duration: 4, ease: "sine.inOut"
    }, "<");
    cameraTimeline.to({}, { duration: 4 });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if(!isAutoPilot) {
    controls.update();
  } else {
    camera.lookAt(targetLookAt);
  }
  composer.render();
}
