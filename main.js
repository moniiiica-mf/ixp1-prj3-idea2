import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// ========== GAME STATE ==========
const gameState = {
    started: false,
    ended: false,
    currentInteractable: null,
    moveSpeed: 0.04,  // Slower, more deliberate movement
    lookSensitivity: 0.002,
    endingAnimation: {
        active: false,
        type: null,
        progress: 0
    }
};

// ========== MOVEMENT STATE ==========
const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// ========== SCENE SETUP ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Lighter background
scene.fog = new THREE.FogExp2(0x1a1a1a, 0.05); // Much less fog for visibility

// Initialize RectAreaLight uniforms for the door light
RectAreaLightUniformsLib.init();

// ========== CAMERA ==========
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 1.6, 3);

// ========== RENDERER ==========
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; // Much brighter exposure
document.getElementById('canvas-container').appendChild(renderer.domElement);

// ========== CONTROLS ==========
const controls = new PointerLockControls(camera, renderer.domElement);

// ========== LIGHTING ==========
// Increased ambient light for visibility
const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
scene.add(ambientLight);

// Bright ceiling bulb
const ceilingBulb = new THREE.PointLight(0xdddddd, 3.5, 20);
ceilingBulb.position.set(0, 4.5, 0);
ceilingBulb.castShadow = true;
scene.add(ceilingBulb);

// Additional room lights for better visibility
const cornerLight1 = new THREE.PointLight(0xaaaaaa, 2.0, 15);
cornerLight1.position.set(-3, 3, -3);
scene.add(cornerLight1);

const cornerLight2 = new THREE.PointLight(0xaaaaaa, 2.0, 15);
cornerLight2.position.set(3, 3, 3);
scene.add(cornerLight2);

// Breathing light that follows player (brighter)
const breathingLight = new THREE.PointLight(0x888888, 1.5, 15);
breathingLight.position.copy(camera.position);
scene.add(breathingLight);

// ========== ROOM CONSTRUCTION ==========
let roomMesh; // Store reference for breathing effect

function createRoom() {
    const roomSize = 10;
    const wallHeight = 5;

    // Load textures for floor (optional - using simple colors as fallback)
    const loader = new THREE.TextureLoader();

    // Room as a box with inward-facing normals (real enclosed space)
    const roomGeo = new THREE.BoxGeometry(roomSize, wallHeight, roomSize);
    roomGeo.scale(-1, 1, 1); // flip normals inward so we see inside

    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
        metalness: 0.05,
        side: THREE.FrontSide
    });

    roomMesh = new THREE.Mesh(roomGeo, wallMat);
    roomMesh.position.y = wallHeight / 2;
    roomMesh.receiveShadow = true;
    roomMesh.userData.wall = true; // Tag for breathing effect
    scene.add(roomMesh);

    // Physical floor plane (darker, receives shadows nicely)
    const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x141414,
        roughness: 0.95,
        metalness: 0.0
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

// ========== INTERACTIVE OBJECTS ==========
const interactables = [];

// 1. REAL REFLECTIVE MIRROR
function createMirror() {
    const mirrorGroup = new THREE.Group();

    // Ornate frame using beveled boxes
    const frame = new THREE.Group();
    const frameDepth = 0.08;
    const frameW = 2.4, frameH = 2.9, frameT = 0.15;

    const frameMat = new THREE.MeshStandardMaterial({
        color: 0x2b2b2b,
        roughness: 0.4,
        metalness: 0.6
    });

    const horiz = new THREE.BoxGeometry(frameW, frameT, frameDepth);
    const vert = new THREE.BoxGeometry(frameT, frameH, frameDepth);

    const top = new THREE.Mesh(horiz, frameMat);
    top.position.y = frameH / 2;
    const bot = new THREE.Mesh(horiz, frameMat);
    bot.position.y = -frameH / 2;
    const lef = new THREE.Mesh(vert, frameMat);
    lef.position.x = -frameW / 2;
    const rig = new THREE.Mesh(vert, frameMat);
    rig.position.x = frameW / 2;

    frame.add(top, bot, lef, rig);

    // REAL reflective surface using Reflector
    const mirrorSurface = new Reflector(new THREE.PlaneGeometry(2.2, 2.6), {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0x888888
    });
    mirrorSurface.position.z = 0.001;

    const panel = new THREE.Group();
    panel.add(mirrorSurface, frame);

    // Place on left wall
    panel.position.set(-4.9, 2.4, 0);
    panel.rotation.y = Math.PI / 2;
    mirrorGroup.add(panel);
    scene.add(mirrorGroup);

    // Bright spotlight on mirror for visibility
    const mirrorSpotlight = new THREE.SpotLight(0xffffff, 3.0, 10, Math.PI / 6);
    mirrorSpotlight.position.set(-3, 3, 0);
    mirrorSpotlight.target.position.set(-4.9, 2.4, 0);
    mirrorSpotlight.castShadow = true;
    scene.add(mirrorSpotlight);
    scene.add(mirrorSpotlight.target);

    // Additional point light for reflections
    const mirrorLight = new THREE.PointLight(0xaaaaaa, 2.0, 10);
    mirrorLight.position.set(-4.2, 2.2, 0.8);
    scene.add(mirrorLight);

    interactables.push({
        object: mirrorGroup,
        type: 'mirror',
        name: 'Mirror',
        prompt: 'Press E to look into the mirror',
        triggerDistance: 2.2
    });

    return mirrorGroup;
}

// 2. REALISTIC CAT (with GLTF loader and sprite fallback)
function createCat() {
    const catGroup = new THREE.Group();
    const loader = new GLTFLoader();

    // Try to load a GLTF cat model (with fallback to geometric cat)
    loader.load(
        'https://huggingface.co/datasets/opensceneassets/animals/resolve/main/cat_lowpoly.glb',
        (gltf) => {
            // Success: use the loaded model
            const model = gltf.scene;
            model.traverse(o => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });
            model.scale.set(0.6, 0.6, 0.6);
            catGroup.add(model);

            // Add BRIGHT eye glow
            const eyeGlow = new THREE.PointLight(0x00ff88, 3.0, 4.0);
            eyeGlow.position.set(0, 0.3, 0.4);
            catGroup.add(eyeGlow);
        },
        undefined,
        (error) => {
            // Fallback: create geometric cat if model fails to load
            console.log('GLTF cat failed to load, using fallback geometry');

            // Cat body
            const bodyGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.6);
            const catMaterial = new THREE.MeshStandardMaterial({
                color: 0x0a0a0a,
                roughness: 0.8
            });
            const body = new THREE.Mesh(bodyGeometry, catMaterial);
            body.position.y = 0.15;
            body.castShadow = true;
            catGroup.add(body);

            // Cat head
            const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const head = new THREE.Mesh(headGeometry, catMaterial);
            head.position.set(0, 0.25, 0.35);
            head.scale.set(1, 1, 1.2);
            head.castShadow = true;
            catGroup.add(head);

            // Three glowing eyes
            const eyeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.9
            });

            const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);

            const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye1.position.set(-0.08, 0.28, 0.45);
            catGroup.add(eye1);

            const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye2.position.set(0.08, 0.28, 0.45);
            catGroup.add(eye2);

            const eye3 = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye3.position.set(0, 0.35, 0.45);
            catGroup.add(eye3);

            // BRIGHT eye glow light
            const eyeLight = new THREE.PointLight(0x00ff88, 3.0, 4.0);
            eyeLight.position.set(0, 0.3, 0.5);
            catGroup.add(eyeLight);
        }
    );

    // Position in corner (appears after a few seconds)
    catGroup.position.set(3.2, 0, 3.2);
    catGroup.visible = false;
    scene.add(catGroup);

    // Spotlight on cat for visibility (always on, even when cat is hidden initially)
    const catSpotlight = new THREE.SpotLight(0x00ff88, 2.0, 8, Math.PI / 8);
    catSpotlight.position.set(3.2, 3, 3.2);
    catSpotlight.target.position.set(3.2, 0, 3.2);
    scene.add(catSpotlight);
    scene.add(catSpotlight.target);

    interactables.push({
        object: catGroup,
        type: 'cat',
        name: 'Cat',
        prompt: 'Press E to approach the cat',
        triggerDistance: 2.4
    });

    return catGroup;
}

// 3. REAL PHYSICAL DOOR (with thickness, handle, hinge, light leak)
function createDoor() {
    const doorGroup = new THREE.Group();

    // Door frame opening in the wall
    const frameMat = new THREE.MeshStandardMaterial({
        color: 0x303030,
        roughness: 0.8
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.25), frameMat);
    frame.receiveShadow = true;
    doorGroup.add(frame);

    // Door leaf (pivot on left edge for opening animation)
    const leafGeo = new THREE.BoxGeometry(1.4, 2.4, 0.08);
    const leafMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.1
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.x = -0.7 + 0.04; // Offset to hinge at left edge
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    doorGroup.add(leaf);

    // Store reference to leaf for opening animation
    doorGroup.userData.leaf = leaf;

    // Door handle (cylindrical, metallic)
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 16);
    const handleMat = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.8
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.45, -0.1, 0.06);
    handle.castShadow = true;
    leaf.add(handle);

    // Thin light crack under door
    const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.03),
        new THREE.MeshBasicMaterial({
            color: 0xffe4b5,
            transparent: true,
            opacity: 0.9
        })
    );
    crack.position.set(0, -1.15, 0.05);
    leaf.add(crack);

    // Position door in back wall
    doorGroup.position.set(0, 1.3, -4.9);
    scene.add(doorGroup);

    // RectAreaLight behind the door (creates realistic light leak) - BRIGHTER
    const areaLight = new THREE.RectAreaLight(0xffe4b5, 8.0, 1.5, 2.5);
    areaLight.position.set(0, 1.2, -5.1);
    areaLight.lookAt(0, 1.2, -4.9);
    scene.add(areaLight);

    // Spotlight on door for visibility
    const doorSpotlight = new THREE.SpotLight(0xffe4b5, 2.5, 10, Math.PI / 6);
    doorSpotlight.position.set(0, 3, -3);
    doorSpotlight.target.position.set(0, 1.3, -4.9);
    doorSpotlight.castShadow = true;
    scene.add(doorSpotlight);
    scene.add(doorSpotlight.target);

    // Store reference for ending animation
    doorGroup.userData.areaLight = areaLight;

    interactables.push({
        object: doorGroup,
        type: 'door',
        name: 'Door',
        prompt: 'Press E to open the door',
        triggerDistance: 2.0
    });

    return doorGroup;
}

// ========== PARTICLES ==========
function createParticles() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 10;     // x
        positions[i + 1] = Math.random() * 5;           // y
        positions[i + 2] = (Math.random() - 0.5) * 10;  // z
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    return particles;
}

// ========== AUDIO ==========
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const catSound = new THREE.PositionalAudio(audioListener);
const ambientSound = new THREE.Audio(audioListener);

function setupAudio() {
    // We'll use Web Audio API to create sounds
    // Cat meowing - create a simple oscillating sound
    const catAudioContext = audioListener.context;
    const catOscillator = catAudioContext.createOscillator();
    const catGain = catAudioContext.createGain();

    // Ambient drone
    const ambientContext = audioListener.context;
    const ambientOscillator = ambientContext.createOscillator();
    const ambientGain = ambientContext.createGain();

    // This is a placeholder - in production you'd load actual audio files
    // For now, we'll add atmospheric sound through oscillators
}

// ========== INITIALIZE SCENE ==========
createRoom();
const mirror = createMirror();
const cat = createCat();
const door = createDoor();
const particles = createParticles();

// ========== INTERACTION SYSTEM ==========
function checkInteractions() {
    if (gameState.ended) return;

    const playerPosition = camera.position.clone();
    let closestInteractable = null;
    let closestDistance = Infinity;

    interactables.forEach(interactable => {
        if (!interactable.object.visible) return;

        const distance = playerPosition.distanceTo(interactable.object.position);

        if (distance < interactable.triggerDistance && distance < closestDistance) {
            closestDistance = distance;
            closestInteractable = interactable;
        }
    });

    const prompt = document.getElementById('interaction-prompt');

    if (closestInteractable) {
        gameState.currentInteractable = closestInteractable;
        prompt.textContent = closestInteractable.prompt;
        prompt.style.display = 'block';
    } else {
        gameState.currentInteractable = null;
        prompt.style.display = 'none';
    }
}

function interact() {
    if (!gameState.currentInteractable || gameState.ended) return;

    const type = gameState.currentInteractable.type;
    gameState.ended = true;
    gameState.endingAnimation.active = true;
    gameState.endingAnimation.type = type;
    gameState.endingAnimation.progress = 0;

    // Hide interaction prompt
    document.getElementById('interaction-prompt').style.display = 'none';

    // Release pointer lock for ending
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

// ========== VISUAL ENDING ANIMATIONS ==========

function animateMirrorEnding(progress) {
    // Progress goes from 0 to 1

    // Phase 1 (0-0.3): Move camera toward mirror, visual distortion
    if (progress < 0.3) {
        const phase = progress / 0.3;

        // Move camera toward mirror
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, -4.5, phase * 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0, phase * 0.05);

        // The Reflector doesn't support vertex manipulation, so we'll use visual effects instead
        // Make the mirror glow and distort the view

        // Increase fog density for distortion effect
        scene.fog.density = 0.05 + phase * 0.15;

        // Camera slight rotation for disorientation
        camera.rotation.z = Math.sin(progress * 30) * 0.02 * phase;
    }

    // Phase 2 (0.3-0.6): Screen distortion, pull into darkness
    else if (progress < 0.6) {
        const phase = (progress - 0.3) / 0.3;

        // Screen shake
        camera.rotation.z = Math.sin(phase * 50) * 0.1 * (1 - phase);

        // Fade to black
        scene.background = new THREE.Color(
            Math.floor(0x1a * (1 - phase)),
            Math.floor(0x1a * (1 - phase)),
            Math.floor(0x1a * (1 - phase))
        );
        renderer.toneMappingExposure = 1.2 * (1 - phase);
    }

    // Phase 3 (0.6-1.0): Respawn in same room
    else {
        const phase = (progress - 0.6) / 0.4;

        if (phase < 0.01) {
            // Reset position
            camera.position.set(0, 1.6, 3);
            camera.rotation.z = 0;
            scene.fog.density = 0.05; // Reset fog to new lighter value
        }

        // Fade back in
        const fadeIn = Math.min(phase * 2, 1);
        scene.background = new THREE.Color(
            Math.floor(0x1a * fadeIn),
            Math.floor(0x1a * fadeIn),
            Math.floor(0x1a * fadeIn)
        );
        renderer.toneMappingExposure = 1.2 * fadeIn;

        // Show questioning text at the end
        if (phase > 0.8) {
            showSubtleQuestion("Am I... awake?");
        }
    }
}

function animateCatEnding(progress) {
    // Phase 1 (0-0.4): Cat stares, then lunges
    if (progress < 0.4) {
        const phase = progress / 0.4;

        // Cat eyes glow brighter
        cat.children.forEach(child => {
            if (child instanceof THREE.PointLight) {
                child.intensity = 0.5 + phase * 3;
            }
            if (child instanceof THREE.Mesh && child.material.color && child.material.color.g > 0.5) {
                child.material.emissive = new THREE.Color(0x00ff88);
                child.material.emissiveIntensity = phase * 2;
            }
        });

        // Cat slowly moves toward camera at first
        if (phase < 0.7) {
            const targetPos = camera.position.clone();
            cat.position.x = THREE.MathUtils.lerp(cat.position.x, targetPos.x, phase * 0.02);
            cat.position.z = THREE.MathUtils.lerp(cat.position.z, targetPos.z, phase * 0.02);
            cat.lookAt(camera.position);
        }
        // Then LUNGES
        else {
            const lungePhase = (phase - 0.7) / 0.3;
            const targetPos = camera.position.clone();
            targetPos.y = 1.6;
            cat.position.lerp(targetPos, lungePhase * 0.5);
            cat.scale.setScalar(1 + lungePhase * 10);
        }
    }

    // Phase 2 (0.4-0.6): Flash/shock effect
    else if (progress < 0.6) {
        const phase = (progress - 0.4) / 0.2;

        // Red flash
        scene.background = new THREE.Color(
            Math.floor(0xFF * (1 - phase)),
            0,
            0
        );

        // Screen shake violently
        camera.rotation.z = Math.sin(phase * 100) * 0.3;
        camera.rotation.x = Math.sin(phase * 80) * 0.2;

        // Hide cat
        if (phase > 0.5) {
            cat.visible = false;
        }
    }

    // Phase 3 (0.6-1.0): Fade to black, then respawn
    else {
        const phase = (progress - 0.6) / 0.4;

        if (phase < 0.3) {
            // Fade to black
            const fadeOut = phase / 0.3;
            scene.background = new THREE.Color(0, 0, 0);
            renderer.toneMappingExposure = 1.2 * (1 - fadeOut);
            camera.rotation.set(0, 0, 0);
        } else {
            // Reset and fade back in
            if (phase < 0.35) {
                camera.position.set(0, 1.6, 3);
                camera.rotation.set(0, 0, 0);
                cat.position.set(3.2, 0, 3.2);
                cat.scale.setScalar(1);
                cat.visible = true;
            }

            const fadeIn = (phase - 0.3) / 0.7;
            scene.background = new THREE.Color(
                Math.floor(0x1a * fadeIn),
                Math.floor(0x1a * fadeIn),
                Math.floor(0x1a * fadeIn)
            );
            renderer.toneMappingExposure = 1.2 * fadeIn;

            if (phase > 0.8) {
                showSubtleQuestion("Did I... wake up?");
            }
        }
    }
}

function animateDoorEnding(progress) {
    const doorLeaf = door.userData.leaf;
    const areaLight = door.userData.areaLight;

    // Phase 1 (0-0.4): Door slowly opens
    if (progress < 0.4) {
        const phase = progress / 0.4;

        // Rotate door leaf open around its hinge (left edge)
        doorLeaf.rotation.y = -phase * Math.PI * 0.7; // Swing open

        // Move camera slightly forward
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, -3.5, phase * 0.1);

        // Area light gets brighter as door opens
        if (areaLight) {
            areaLight.intensity = 4.0 + phase * 10;
        }
    }

    // Phase 2 (0.4-0.7): Blinding white light floods in
    else if (progress < 0.7) {
        const phase = (progress - 0.4) / 0.3;

        // Increase light intensity dramatically
        if (areaLight) {
            areaLight.intensity = 14.0 + phase * 50;
        }

        // Fade scene to white
        const whiteAmount = phase * 255;
        scene.background = new THREE.Color(
            Math.floor(whiteAmount),
            Math.floor(whiteAmount),
            Math.floor(whiteAmount)
        );

        // Increase exposure
        renderer.toneMappingExposure = 1.2 + phase * 3;

        // Everything fades to white
        scene.fog.color = new THREE.Color(
            Math.floor(0x1a + whiteAmount),
            Math.floor(0x1a + whiteAmount),
            Math.floor(0x1a + whiteAmount)
        );
    }

    // Phase 3 (0.7-1.0): Pure white, then questioning
    else {
        const phase = (progress - 0.7) / 0.3;

        if (phase < 0.3) {
            // Stay in pure white
            scene.background = new THREE.Color(0xffffff);
            renderer.toneMappingExposure = 3;
        } else {
            // Slowly fade back to dark
            const fadeBack = (phase - 0.3) / 0.7;
            const darkness = 1 - fadeBack;
            scene.background = new THREE.Color(
                Math.floor(0xff * darkness),
                Math.floor(0xff * darkness),
                Math.floor(0xff * darkness)
            );
            renderer.toneMappingExposure = 3 * darkness + 1.2 * fadeBack;
            scene.fog.color = new THREE.Color(0x1a1a1a);

            // Reset
            if (fadeBack > 0.5 && fadeBack < 0.55) {
                camera.position.set(0, 1.6, 3);
                doorLeaf.rotation.y = 0;
                if (areaLight) {
                    areaLight.intensity = 8.0; // Reset to new brighter value
                }
            }

            if (phase > 0.8) {
                showSubtleQuestion("...But am I really awake?");
            }
        }
    }
}

function showSubtleQuestion(text) {
    const endingScreen = document.getElementById('ending-screen');
    const endingText = document.getElementById('ending-text');

    endingText.innerHTML = `<span class="glitch">${text}</span>`;
    endingScreen.style.display = 'flex';
}

// ========== EVENT LISTENERS ==========
renderer.domElement.addEventListener('click', () => {
    if (!gameState.started) return;
    if (!document.pointerLockElement) {
        controls.lock();
    }
});

controls.addEventListener('lock', () => {
    document.getElementById('instructions').classList.add('hidden');
});

controls.addEventListener('unlock', () => {
    if (gameState.started && !gameState.ended) {
        document.getElementById('instructions').classList.remove('hidden');
    }
});

document.addEventListener('keydown', (event) => {
    if (!gameState.started || gameState.ended) return;

    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            movement.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            movement.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            movement.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            movement.right = true;
            break;
        case 'KeyE':
            interact();
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            movement.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            movement.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            movement.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            movement.right = false;
            break;
    }
});

// Start button
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('intro-screen').style.display = 'none';
    gameState.started = true;
    controls.lock();

    // Make cat visible after a few seconds
    setTimeout(() => {
        cat.visible = true;
    }, 3000);
});

// Restart button
document.getElementById('restart-button').addEventListener('click', () => {
    location.reload();
});

// Window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========== MOVEMENT SYSTEM ==========
function updateMovement(delta) {
    if (!controls.isLocked || gameState.ended) return;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(movement.forward) - Number(movement.backward);
    direction.x = Number(movement.right) - Number(movement.left);
    direction.normalize();

    if (movement.forward || movement.backward) {
        velocity.z -= direction.z * gameState.moveSpeed;
    }
    if (movement.left || movement.right) {
        velocity.x -= direction.x * gameState.moveSpeed;
    }

    controls.moveRight(-velocity.x);
    controls.moveForward(-velocity.z);

    // Keep player within room bounds
    camera.position.x = Math.max(-4.5, Math.min(4.5, camera.position.x));
    camera.position.z = Math.max(-4.5, Math.min(4.5, camera.position.z));
    camera.position.y = 1.6; // Lock height
}

// ========== ANIMATION LOOP ==========
let time = 0;
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    time += delta;

    // Handle ending animations
    if (gameState.endingAnimation.active) {
        gameState.endingAnimation.progress += delta * 0.15; // Progress speed

        if (gameState.endingAnimation.type === 'mirror') {
            animateMirrorEnding(gameState.endingAnimation.progress);
        } else if (gameState.endingAnimation.type === 'cat') {
            animateCatEnding(gameState.endingAnimation.progress);
        } else if (gameState.endingAnimation.type === 'door') {
            animateDoorEnding(gameState.endingAnimation.progress);
        }

        // Stop animation after completion (progress > 1)
        if (gameState.endingAnimation.progress > 1) {
            // Keep it frozen at the end
            gameState.endingAnimation.progress = 1;
        }
    }

    // Normal gameplay
    if (gameState.started && !gameState.ended) {
        updateMovement(delta);
        checkInteractions();

        // Breathing light effect (brighter)
        breathingLight.intensity = 1.5 + Math.sin(time * 0.5) * 0.3;
        breathingLight.position.copy(camera.position);

        // Animate particles
        particles.rotation.y += 0.0002;
        const positions = particles.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] += Math.sin(time + positions[i]) * 0.0005;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Cat eye glow pulse (brighter)
        if (cat.visible) {
            cat.children.forEach(child => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 3.0 + Math.sin(time * 3) * 0.5;
                }
                if (child instanceof THREE.Mesh && child.material.color && child.material.color.g > 0.5) {
                    child.material.opacity = 0.9 + Math.sin(time * 3) * 0.1;
                }
            });
        }

        // Subtle room breathing animation (scale pulse)
        if (roomMesh) {
            const breathe = 1.0 + Math.sin(time * 0.3) * 0.002;
            roomMesh.scale.set(breathe, 1.0, breathe);
        }

        // Ceiling bulb flicker (keep bright)
        ceilingBulb.intensity = 3.5 + Math.sin(time * 1.2) * 0.3;
    }

    renderer.render(scene, camera);
}

animate();
