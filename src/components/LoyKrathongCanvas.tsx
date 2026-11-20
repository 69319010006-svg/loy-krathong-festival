import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ContestantKrathong, AtmospherePerson } from '../types';

interface LoyKrathongCanvasProps {
  krathongs: ContestantKrathong[];
  onSelectKrathong: (krathong: ContestantKrathong) => void;
  focusedKrathongId: string | null;
  onClearFocus: () => void;
}

interface KrathongMeshEntry {
  group: THREE.Group;
  data: ContestantKrathong;
  candleLight: THREE.PointLight;
  haloMesh: THREE.Mesh;
  rippleMesh: THREE.Mesh;
  spawnStartTime: number; // for smooth entrance animation
  isSpawning: boolean;
}

export const LoyKrathongCanvas: React.FC<LoyKrathongCanvasProps> = ({
  krathongs,
  onSelectKrathong,
  focusedKrathongId,
  onClearFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredKrathong, setHoveredKrathong] = useState<ContestantKrathong | null>(null);

  // References across render lifecycles
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const krathongGroupRef = useRef<THREE.Group | null>(null);
  const krathongMeshMapRef = useRef<Map<string, KrathongMeshEntry>>(new Map());

  // Cinematic Camera Smooth Interpolation State
  const cameraTargetPos = useRef<THREE.Vector3 | null>(null);
  const controlsTargetLookAt = useRef<THREE.Vector3 | null>(null);
  const isCameraGliding = useRef<boolean>(false);

  // Shader Uniform for High-Speed GPU Water
  const waterUniforms = useRef<{ uTime: { value: number } }>({ uTime: { value: 0 } });

  // -------------------------------------------------------------
  // 1. INITIALIZE 3D WORLD ONCE (PERMANENT SCENE, LIGHTS & ASSETS)
  // -------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c192c, 0.009);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      350
    );
    camera.position.set(0, 18, 48);
    cameraRef.current = camera;

    // High performance WebGL renderer with optimized pixel ratio
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6)); // Fluid 60fps on mobile
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minPolarAngle = 0.12;
    controls.minDistance = 5;
    controls.maxDistance = 110;
    controls.target.set(0, 2.5, 4);
    controlsRef.current = controls;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x2d4368, 2.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xfff5d6, 3.4);
    moonLight.position.set(30, 48, -75);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 180;
    const d = 55;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    scene.add(moonLight);

    const festLeft = new THREE.DirectionalLight(0xffb74d, 1.4);
    festLeft.position.set(-40, 25, 20);
    scene.add(festLeft);

    const festRight = new THREE.DirectionalLight(0xffd54f, 1.4);
    festRight.position.set(40, 25, 20);
    scene.add(festRight);

    // --- Starfield & Moon ---
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 320;
      starPositions[i + 1] = Math.random() * 110 + 15;
      starPositions[i + 2] = (Math.random() - 0.5) * 320;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.45, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // Full Moon
    const moonGroup = new THREE.Group();
    moonGroup.position.set(32, 45, -80);
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(4.8, 32, 32), new THREE.MeshBasicMaterial({ color: 0xfffae8 }));
    moonGroup.add(moonMesh);

    // Lunar Halo
    const canvasHalo = document.createElement('canvas');
    canvasHalo.width = 256;
    canvasHalo.height = 256;
    const ctxHalo = canvasHalo.getContext('2d')!;
    const grad = ctxHalo.createRadialGradient(128, 128, 30, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 250, 215, 0.9)');
    grad.addColorStop(0.3, 'rgba(255, 225, 140, 0.45)');
    grad.addColorStop(0.7, 'rgba(255, 200, 100, 0.15)');
    grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctxHalo.fillStyle = grad;
    ctxHalo.fillRect(0, 0, 256, 256);

    const haloTex = new THREE.CanvasTexture(canvasHalo);
    const haloMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    haloMesh.position.z = 0.2;
    moonGroup.add(haloMesh);
    scene.add(moonGroup);

    // Distant Mountains
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x0c1b2c, roughness: 0.95 });
    for (let m = -4; m <= 4; m++) {
      const mCone = new THREE.Mesh(
        new THREE.ConeGeometry(22 + Math.abs(m) * 4, 30 + Math.random() * 12, 16),
        mountainMat
      );
      mCone.position.set(m * 28 + (Math.random() - 0.5) * 8, 10, -115 + (Math.random() - 0.5) * 12);
      scene.add(mCone);
    }

    // --- GPU Animated River Surface (Zero CPU load!) ---
    const riverWidth = 56;
    const riverLength = 170;
    const riverGeo = new THREE.PlaneGeometry(riverWidth, riverLength, 48, 64);
    riverGeo.rotateX(-Math.PI / 2);

    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x092a48,
      roughness: 0.1,
      metalness: 0.9,
    });

    // Hook custom GPU vertex displacement shader
    riverMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = waterUniforms.current.uTime;
      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float wave = sin(position.x * 0.35 + uTime * 1.5) * 0.11 + cos(position.z * 0.25 + uTime * 1.2) * 0.11;
        transformed.y += wave;
        `
      );
    };

    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(0, 0, -2);
    riverMesh.receiveShadow = true;
    scene.add(riverMesh);

    // River banks, Promenades & Bridge
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x1d3a24, roughness: 0.85 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a525d, roughness: 0.7 });
    const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0x6d4c3d, roughness: 0.65 });

    const leftBank = new THREE.Mesh(new THREE.BoxGeometry(28, 3, riverLength), grassMat);
    leftBank.position.set(-riverWidth / 2 - 14, 1.2, -2);
    leftBank.receiveShadow = true;
    scene.add(leftBank);

    const leftWalkway = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, riverLength), stoneMat);
    leftWalkway.position.set(-riverWidth / 2 - 3, 2.7, -2);
    scene.add(leftWalkway);

    const rightBank = new THREE.Mesh(new THREE.BoxGeometry(32, 3, riverLength), grassMat);
    rightBank.position.set(riverWidth / 2 + 16, 1.2, -2);
    rightBank.receiveShadow = true;
    scene.add(rightBank);

    const rightWalkway = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, riverLength), stoneMat);
    rightWalkway.position.set(riverWidth / 2 + 3.5, 2.7, -2);
    scene.add(rightWalkway);

    // Pier
    const pier = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 11), woodDeckMat);
    pier.position.set(-riverWidth / 2 + 7, 1.0, 18);
    pier.receiveShadow = true;
    scene.add(pier);

    // Arched Bridge
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, -38);
    const bridgeCurve = new THREE.Mesh(
      new THREE.CylinderGeometry(riverWidth / 2 + 3, riverWidth / 2 + 3, 4.2, 32, 1, true, 0, Math.PI),
      woodDeckMat
    );
    bridgeCurve.rotation.z = Math.PI / 2;
    bridgeCurve.rotation.y = Math.PI / 2;
    bridgeCurve.position.y = -riverWidth / 2 + 4.8;
    bridgeGroup.add(bridgeCurve);

    for (let bx = -riverWidth / 2 + 4; bx <= riverWidth / 2 - 4; bx += 5.5) {
      const bArchY = 4.8 - (bx * bx) / (riverWidth * 1.4);
      const bLantern = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb703 }));
      bLantern.position.set(bx, bArchY + 1.2, 0);
      bridgeGroup.add(bLantern);

      const bLight = new THREE.PointLight(0xffb703, 1.4, 6);
      bLight.position.copy(bLantern.position);
      bridgeGroup.add(bLight);
    }
    scene.add(bridgeGroup);

    // String Lights
    const stringColors = [0xffd166, 0xef476f, 0x06d6a0, 0x118ab2, 0xffa07a];
    [-18, 0, 18, 36, 54].forEach((pz, idx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 8), woodDeckMat);
      pole.position.set(-riverWidth / 2 - 0.5, 5, pz);
      scene.add(pole);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: stringColors[idx % stringColors.length] }));
      bulb.position.set(-riverWidth / 2 - 0.5, 7.8, pz);
      scene.add(bulb);

      const pLight = new THREE.PointLight(stringColors[idx % stringColors.length], 1.6, 12);
      pLight.position.copy(bulb.position);
      scene.add(pLight);
    });

    // --- Thai Chedi ---
    const chediGroup = new THREE.Group();
    chediGroup.position.set(riverWidth / 2 + 16, 2.7, -18);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfdb813, metalness: 0.9, roughness: 0.18, emissive: 0x664600, emissiveIntensity: 0.35 });
    const marbleWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.5 });

    const cBase1 = new THREE.Mesh(new THREE.BoxGeometry(14, 1.4, 14), marbleWhiteMat);
    const cBase2 = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.2, 11.5), marbleWhiteMat);
    cBase2.position.y = 1.3;
    const cBase3 = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.0, 9.5), goldMat);
    cBase3.position.y = 2.4;
    chediGroup.add(cBase1, cBase2, cBase3);

    const bellMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.8, 6.0, 24), goldMat);
    bellMesh.position.y = 6.7;
    bellMesh.castShadow = true;
    chediGroup.add(bellMesh);

    const spireMesh = new THREE.Mesh(new THREE.ConeGeometry(2.0, 9.5, 24), goldMat);
    spireMesh.position.y = 14.5;
    spireMesh.castShadow = true;
    chediGroup.add(spireMesh);

    const chediSpot = new THREE.PointLight(0xffdf66, 3.2, 26);
    chediSpot.position.set(0, 5, 5);
    chediGroup.add(chediSpot);
    scene.add(chediGroup);

    // --- Thai Temple ---
    const templeGroup = new THREE.Group();
    templeGroup.position.set(riverWidth / 2 + 18, 2.7, 8);
    const templeWall = new THREE.Mesh(new THREE.BoxGeometry(14, 6.0, 22), marbleWhiteMat);
    templeWall.position.y = 3.0;
    templeWall.castShadow = true;
    templeGroup.add(templeWall);

    const templeRoofMat = new THREE.MeshStandardMaterial({ color: 0xce491f, roughness: 0.4 });
    const tRoof1 = new THREE.Mesh(new THREE.ConeGeometry(12, 5.0, 4), templeRoofMat);
    tRoof1.rotation.y = Math.PI / 4;
    tRoof1.position.y = 8.0;
    tRoof1.scale.set(1.4, 0.65, 2.1);
    templeGroup.add(tRoof1);

    const templeLight = new THREE.PointLight(0xffaa22, 3.5, 18);
    templeLight.position.set(-8.5, 3.0, 0);
    templeGroup.add(templeLight);
    scene.add(templeGroup);

    // --- Thai House ---
    const house = new THREE.Group();
    house.position.set(-riverWidth / 2 - 16, 2.7, -12);
    const teakMat = new THREE.MeshStandardMaterial({ color: 0x4a2e19, roughness: 0.75 });
    const hFloor = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.45, 12), teakMat);
    hFloor.position.y = 3.6;
    house.add(hFloor);

    const hRoom = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.8, 9), new THREE.MeshStandardMaterial({ color: 0x633d20 }));
    hRoom.position.set(-0.5, 5.5, 0);
    house.add(hRoom);

    const hRoof = new THREE.Mesh(new THREE.ConeGeometry(7.0, 4.0, 4), teakMat);
    hRoof.rotation.y = Math.PI / 4;
    hRoof.position.set(-0.5, 9.0, 0);
    hRoof.scale.set(1.4, 0.85, 1.7);
    house.add(hRoof);
    scene.add(house);

    // --- Atmosphere People (26 people) ---
    const peopleGroup = new THREE.Group();
    const personMeshes: { group: THREE.Group; data: AtmospherePerson; leftArm?: THREE.Mesh; rightArm?: THREE.Mesh }[] = [];
    const attireColors = [0xd90429, 0x3a86ff, 0x8338ec, 0x06d6a0, 0xf72585, 0xfb8500, 0x2ec4b6];

    for (let i = 0; i < 26; i++) {
      const isWalking = i % 3 !== 0;
      const onBridge = i >= 20;
      let posX = (i % 2 === 0 ? 1 : -1) * (riverWidth / 2 + 3 + (Math.random() - 0.5) * 4);
      let posZ = -45 + i * 4.0;
      let posY = 2.7;

      if (onBridge) {
        posX = -12 + (i - 20) * 4.5;
        posZ = -38;
        posY = 4.8 - (posX * posX) / (riverWidth * 1.4);
      } else if (i === 1 || i === 4 || i === 8) {
        posX = -riverWidth / 2 + 4 + (Math.random() - 0.5) * 6;
        posZ = 15 + (Math.random() - 0.5) * 6;
        posY = 1.0;
      }

      const pGroup = new THREE.Group();
      pGroup.position.set(posX, posY, posZ);
      pGroup.rotation.y = onBridge ? Math.PI : (posX > 0 ? -Math.PI / 2 : Math.PI / 2);

      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cfb0, roughness: 0.75 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinMat);
      head.position.y = 1.62;
      pGroup.add(head);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.7, 8), new THREE.MeshStandardMaterial({ color: attireColors[i % attireColors.length], roughness: 0.5 }));
      torso.position.y = 1.1;
      pGroup.add(torso);

      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.75, 8), new THREE.MeshStandardMaterial({ color: 0x2b2d42 }));
      lower.position.y = 0.45;
      pGroup.add(lower);

      const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6), skinMat);
      leftArm.position.set(-0.32, 1.1, 0);
      pGroup.add(leftArm);

      const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6), skinMat);
      rightArm.position.set(0.32, 1.1, 0);
      pGroup.add(rightArm);

      peopleGroup.add(pGroup);
      personMeshes.push({
        group: pGroup,
        data: {
          id: i,
          posX,
          posZ,
          posY,
          rotationY: pGroup.rotation.y,
          bodyColor: '#f5cfb0',
          attireColor: `#${attireColors[i % attireColors.length].toString(16)}`,
          sashColor: '#ffd700',
          isWalking: !onBridge && isWalking,
          walkSpeed: 0.18 * (Math.random() > 0.5 ? 1 : -1),
          targetZ: posZ,
          minZ: posZ - 8,
          maxZ: posZ + 8,
          hairStyle: 'chignon',
        },
        leftArm,
        rightArm,
      });
    }
    scene.add(peopleGroup);

    // Dedicated Group for Floating Krathongs (for efficient delta updates!)
    const krathongGroup = new THREE.Group();
    scene.add(krathongGroup);
    krathongGroupRef.current = krathongGroup;

    // --- Raycasting & Touch Input ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastIntersect = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const targets: THREE.Object3D[] = [];
      krathongGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) targets.push(child);
      });

      const intersects = raycaster.intersectObjects(targets, false);
      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && !curr.userData?.id && curr.parent) {
          curr = curr.parent;
        }
        if (curr && curr.userData?.contestant) {
          return curr.userData.contestant as ContestantKrathong;
        }
      }
      return null;
    };

    const handlePointerMove = (e: MouseEvent) => {
      const hit = getRaycastIntersect(e.clientX, e.clientY);
      if (hit) {
        renderer.domElement.style.cursor = 'pointer';
        setHoveredKrathong(hit);
        krathongMeshMapRef.current.forEach((entry, id) => {
          entry.haloMesh.material.opacity = id === hit.id ? 0.95 : 0;
        });
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredKrathong(null);
        krathongMeshMapRef.current.forEach((entry) => {
          entry.haloMesh.material.opacity = 0;
        });
      }
    };

    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      touchStartTime = Date.now();
      if ('touches' in e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else {
        touchStartX = e.clientX;
        touchStartY = e.clientY;
      }
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      const duration = Date.now() - touchStartTime;
      let clientX = 0;
      let clientY = 0;
      if ('changedTouches' in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const dist = Math.hypot(clientX - touchStartX, clientY - touchStartY);
      if (duration < 400 && dist < 12) {
        const hit = getRaycastIntersect(clientX, clientY);
        if (hit) {
          onSelectKrathong(hit);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousemove', handlePointerMove);
    domEl.addEventListener('mousedown', handlePointerDown);
    domEl.addEventListener('mouseup', handlePointerUp);
    domEl.addEventListener('touchstart', handlePointerDown, { passive: true });
    domEl.addEventListener('touchend', handlePointerUp, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    };
    window.addEventListener('resize', handleResize);

    // --- Buttery-Smooth Animation Loop ---
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // GPU Water time uniform update (0% CPU cost!)
      waterUniforms.current.uTime.value = elapsedTime;

      // Smooth Camera Drone Glide (Cinematic Lerp)
      if (isCameraGliding.current && cameraTargetPos.current && controlsTargetLookAt.current) {
        camera.position.lerp(cameraTargetPos.current, 0.055);
        controls.target.lerp(controlsTargetLookAt.current, 0.055);

        if (camera.position.distanceTo(cameraTargetPos.current) < 0.12) {
          isCameraGliding.current = false;
        }
      }

      controls.update();

      // Animate Krathongs (smooth entrance lowering, bobbing & drift)
      const now = performance.now();
      krathongMeshMapRef.current.forEach((entry) => {
        const { group, data, rippleMesh, candleLight } = entry;

        // Smooth Entrance Descent Animation for newly added krathongs
        if (entry.isSpawning) {
          const progress = Math.min((now - entry.spawnStartTime) / 1600, 1.0); // 1.6s smooth descent
          // Ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const currentY = THREE.MathUtils.lerp(1.8, data.baseY, ease);
          group.position.y = currentY;

          // Expanding Ripple Rings
          const rippleScale = THREE.MathUtils.lerp(0.8, 2.6, ease);
          rippleMesh.scale.set(rippleScale, rippleScale, rippleScale);
          (rippleMesh.material as THREE.MeshBasicMaterial).opacity = (1 - ease) * 0.7;

          if (progress >= 1.0) {
            entry.isSpawning = false;
          }
        } else {
          // Normal water floating wave bobbing
          const waveY =
            data.baseY +
            Math.sin(elapsedTime * 2.2 * data.speed + data.phase) * data.amplitude;
          group.position.y = waveY;

          // Continuous subtle water ripple
          const rippleScale = 1.0 + Math.sin(elapsedTime * 2.5 + data.phase) * 0.25;
          rippleMesh.scale.set(rippleScale, rippleScale, rippleScale);
          (rippleMesh.material as THREE.MeshBasicMaterial).opacity = 0.35;
        }

        // Gentle rocking roll and pitch
        group.rotation.x = Math.sin(elapsedTime * 1.8 + data.phase) * 0.035;
        group.rotation.z = Math.cos(elapsedTime * 1.5 + data.phase) * 0.035;
        group.rotation.y += data.rotationSpeed;

        // Downstream drift
        group.position.z += 0.016 * data.speed;
        if (group.position.z > 62) {
          group.position.z = -72;
        }

        // Candle Flame multi-frequency organic glow
        candleLight.intensity = 1.8 + Math.sin(elapsedTime * 12 + data.phase * 3) * 0.45;
      });

      // Animate walking people
      personMeshes.forEach(({ group, data, leftArm, rightArm }) => {
        if (data.isWalking) {
          group.position.z += data.walkSpeed * 0.035;
          if (group.position.z > data.maxZ || group.position.z < data.minZ) {
            data.walkSpeed *= -1;
            group.rotation.y += Math.PI;
          }
          group.position.y = data.posY + Math.abs(Math.sin(elapsedTime * 6)) * 0.08;

          if (leftArm && rightArm) {
            leftArm.rotation.x = Math.sin(elapsedTime * 6) * 0.4;
            rightArm.rotation.x = -Math.sin(elapsedTime * 6) * 0.4;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousemove', handlePointerMove);
      domEl.removeEventListener('mousedown', handlePointerDown);
      domEl.removeEventListener('mouseup', handlePointerUp);
      domEl.removeEventListener('touchstart', handlePointerDown);
      domEl.removeEventListener('touchend', handlePointerUp);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run ONCE on mount! Scene is never destroyed needlessly!

  // -------------------------------------------------------------
  // 2. DELTA RECONCILIATION FOR KRATHONGS (BLAZING FAST & FLUID)
  // -------------------------------------------------------------
  useEffect(() => {
    const krathongGroup = krathongGroupRef.current;
    if (!krathongGroup) return;

    const meshMap = krathongMeshMapRef.current;
    const incomingIds = new Set(krathongs.map((k) => k.id));

    // A. Remove krathongs that no longer exist
    meshMap.forEach((entry, id) => {
      if (!incomingIds.has(id)) {
        krathongGroup.remove(entry.group);
        meshMap.delete(id);
      }
    });

    // Helper to generate 3D Sprite label
    function createKrathongLabel(kData: ContestantKrathong): THREE.Sprite {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(11, 16, 33, 0.88)';
      ctx.roundRect(10, 10, 364, 108, 24);
      ctx.fill();

      ctx.lineWidth = 4;
      const strokeGrad = ctx.createLinearGradient(10, 10, 374, 118);
      strokeGrad.addColorStop(0, '#ffd700');
      strokeGrad.addColorStop(1, '#ff9900');
      ctx.strokeStyle = strokeGrad;
      ctx.stroke();

      ctx.font = 'bold 26px "Prompt", "Sarabun", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(kData.name, 28, 48);

      ctx.font = '18px "Prompt", "Sarabun", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(`📍 ${kData.location} • ${kData.category}`, 28, 76);

      ctx.font = 'bold 22px "Prompt", sans-serif';
      ctx.fillStyle = '#ff69b4';
      ctx.fillText(`⭐ ${kData.votes.toLocaleString()} โหวต`, 28, 104);

      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(4.2, 1.4, 1.0);
      sprite.position.set(0, 2.4, 0);
      return sprite;
    }

    // Helper to build detailed 3D Krathong mesh
    function buildKrathongMesh(kData: ContestantKrathong): { group: THREE.Group; candleLight: THREE.PointLight; haloMesh: THREE.Mesh; rippleMesh: THREE.Mesh } {
      const kGroup = new THREE.Group();
      kGroup.position.set(kData.posX, kData.baseY, kData.posZ);
      kGroup.userData = { id: kData.id, contestant: kData };

      // Base Banana Trunk
      const baseStemMat = new THREE.MeshStandardMaterial({ color: 0x1f4733, roughness: 0.65 });
      const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.45, 0.42, 20), baseStemMat);
      baseMesh.position.y = 0.21;
      kGroup.add(baseMesh);

      // Banana Leaf Rind Ribbon
      const rindMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.5 });
      const rind = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.47, 0.38, 20, 1, true), rindMat);
      rind.position.y = 0.21;
      kGroup.add(rind);

      // Water Ripple Ring
      const rippleMat = new THREE.MeshBasicMaterial({ color: 0x64dfdf, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
      const rippleMesh = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.85, 24), rippleMat);
      rippleMesh.rotation.x = -Math.PI / 2;
      rippleMesh.position.y = 0.05;
      kGroup.add(rippleMesh);

      // Petal Colors
      let petalColorHex = 0x40916c;
      let accentColorHex = 0xffd166;
      let flowerColorHex = 0xffaa00;

      if (kData.styleId === 'lotus-pink') {
        petalColorHex = 0xff758f;
        accentColorHex = 0xffb3c1;
        flowerColorHex = 0xffffff;
      } else if (kData.styleId === 'royal-gold') {
        petalColorHex = 0xffd700;
        accentColorHex = 0xfffae0;
        flowerColorHex = 0xffb703;
      } else if (kData.styleId === 'orchid-purple') {
        petalColorHex = 0x9d4edd;
        accentColorHex = 0xe0aaff;
        flowerColorHex = 0xf72585;
      } else if (kData.styleId === 'nature-flower') {
        petalColorHex = 0xf72585;
        accentColorHex = 0x4cc9f0;
        flowerColorHex = 0xfee440;
      }

      const petalMat = new THREE.MeshStandardMaterial({ color: petalColorHex, roughness: 0.4, side: THREE.DoubleSide });
      const accentMat = new THREE.MeshStandardMaterial({ color: accentColorHex, roughness: 0.3, side: THREE.DoubleSide });

      // Outer Petals
      const outerPetalGeo = new THREE.ConeGeometry(0.42, 1.1, 5);
      for (let p = 0; p < 14; p++) {
        const angle = (p / 14) * Math.PI * 2;
        const petal = new THREE.Mesh(outerPetalGeo, petalMat);
        petal.position.set(Math.cos(angle) * 1.35, 0.45, Math.sin(angle) * 1.35);
        petal.rotation.x = Math.PI / 3.2;
        petal.rotation.z = -angle;
        kGroup.add(petal);
      }

      // Middle Petals
      const midPetalGeo = new THREE.ConeGeometry(0.35, 0.95, 5);
      for (let p = 0; p < 10; p++) {
        const angle = (p / 10) * Math.PI * 2 + 0.3;
        const petal = new THREE.Mesh(midPetalGeo, accentMat);
        petal.position.set(Math.cos(angle) * 0.95, 0.52, Math.sin(angle) * 0.95);
        petal.rotation.x = Math.PI / 3.8;
        petal.rotation.z = -angle;
        kGroup.add(petal);
      }

      // Jasmine Buds
      const jasmineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      for (let j = 0; j < 12; j++) {
        const jAngle = (j / 12) * Math.PI * 2;
        const jBud = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), jasmineMat);
        jBud.position.set(Math.cos(jAngle) * 0.65, 0.58, Math.sin(jAngle) * 0.65);
        kGroup.add(jBud);
      }

      // Center Marigold
      const marigoldCenter = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 1), new THREE.MeshStandardMaterial({ color: flowerColorHex, roughness: 0.45 }));
      marigoldCenter.position.y = 0.65;
      kGroup.add(marigoldCenter);

      // Candle
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.95, 10), new THREE.MeshStandardMaterial({ color: 0xfff3b0, roughness: 0.25 }));
      candle.position.set(0, 1.05, 0);
      kGroup.add(candle);

      // Flame
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      flame.scale.set(0.85, 1.9, 0.85);
      flame.position.set(0, 1.62, 0);
      kGroup.add(flame);

      // Incense Sticks
      const stickMat = new THREE.MeshBasicMaterial({ color: 0x8d5b4c });
      const emberMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
      for (let s = -1; s <= 1; s++) {
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.15, 6), stickMat);
        stick.position.set(s * 0.14, 1.15, -0.2);
        stick.rotation.z = s * 0.09;
        kGroup.add(stick);

        const ember = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), emberMat);
        ember.position.set(s * 0.14, 1.74, -0.2);
        kGroup.add(ember);
      }

      const candleLight = new THREE.PointLight(0xffa200, 2.2, 5.5);
      candleLight.position.set(0, 1.6, 0);
      kGroup.add(candleLight);

      // 3D Label
      const labelSprite = createKrathongLabel(kData);
      kGroup.add(labelSprite);

      // Selection Halo
      const haloGeo = new THREE.RingGeometry(1.6, 1.85, 24);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0 });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.y = 0.28;
      kGroup.add(haloMesh);

      return { group: kGroup, candleLight, haloMesh, rippleMesh };
    }

    // B. Add new krathongs with smooth entrance animation
    krathongs.forEach((k) => {
      if (!meshMap.has(k.id)) {
        const { group, candleLight, haloMesh, rippleMesh } = buildKrathongMesh(k);
        krathongGroup.add(group);

        meshMap.set(k.id, {
          group,
          data: k,
          candleLight,
          haloMesh,
          rippleMesh,
          spawnStartTime: performance.now(),
          isSpawning: true, // triggers smooth lowering entrance
        });
      } else {
        // Update vote and data reference
        const entry = meshMap.get(k.id)!;
        entry.data = k;
        entry.group.userData.contestant = k;
      }
    });
  }, [krathongs]);

  // -------------------------------------------------------------
  // 3. CINEMATIC CAMERA DRONE GLIDE TO FOCUSED KRATHONG
  // -------------------------------------------------------------
  useEffect(() => {
    if (focusedKrathongId) {
      const entry = krathongMeshMapRef.current.get(focusedKrathongId);
      if (entry) {
        const targetPos = entry.group.position;
        // Set smooth glide targets
        controlsTargetLookAt.current = new THREE.Vector3(targetPos.x, targetPos.y + 0.6, targetPos.z);
        cameraTargetPos.current = new THREE.Vector3(targetPos.x, targetPos.y + 2.8, targetPos.z + 6.5);
        isCameraGliding.current = true;
      }
    }
  }, [focusedKrathongId]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Floating Card */}
      {hoveredKrathong && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-slate-900/95 backdrop-blur-md border-2 border-amber-400 rounded-2xl text-white shadow-2xl flex items-center space-x-3 animate-fade-in transition-all">
          <img
            src={hoveredKrathong.photoUrl}
            alt={hoveredKrathong.name}
            className="w-10 h-10 rounded-xl object-cover border border-amber-400"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-amber-200 text-sm">{hoveredKrathong.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                {hoveredKrathong.location}
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span className="text-pink-400 font-bold">⭐ {hoveredKrathong.votes.toLocaleString()} โหวต</span>
              <span>•</span>
              <span className="text-yellow-300">แตะเพื่อดูคำอธิษฐาน & โหวต</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
