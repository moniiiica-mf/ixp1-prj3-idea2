import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ========== GAME STATE ==========
const gameState = {
    started: false,
    ended: false,
    currentInteractable: null,
    moveSpeed: 0.08,
    lookSensitivity: 0.002
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
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0b0b0b, 0.15);

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
renderer.toneMappingExposure = 0.3;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// ========== CONTROLS ==========
const controls = new PointerLockControls(camera, renderer.domElement);

// ========== LIGHTING ==========
const ambientLight = new THREE.AmbientLight(0x101010, 0.3);
scene.add(ambientLight);

// Point light near mirror
const mirrorLight = new THREE.PointLight(0x888888, 0.8, 10);
mirrorLight.position.set(-4, 2, 0);
mirrorLight.castShadow = true;
scene.add(mirrorLight);

// Door light (warm glow through crack)
const doorLight = new THREE.PointLight(0xe6d7b2, 1.2, 8);
doorLight.position.set(0, 1, -4.5);
scene.add(doorLight);

// Subtle breathing light
const breathingLight = new THREE.PointLight(0x444444, 0.5, 15);
breathingLight.position.copy(camera.position);
scene.add(breathingLight);

// ========== ROOM CONSTRUCTION ==========
function createRoom() {
    const roomSize = 10;
    const wallHeight = 5;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x141414,
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(floorGeometry, floorMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    scene.add(ceiling);

    // Walls with slight distortion
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.2
    });

    // Back wall
    const backWall = createDistortedWall(roomSize, wallHeight, wallMaterial);
    backWall.position.z = -roomSize / 2;
    backWall.position.y = wallHeight / 2;
    scene.add(backWall);

    // Front wall
    const frontWall = createDistortedWall(roomSize, wallHeight, wallMaterial);
    frontWall.position.z = roomSize / 2;
    frontWall.position.y = wallHeight / 2;
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);

    // Left wall (with mirror)
    const leftWall = createDistortedWall(roomSize, wallHeight, wallMaterial);
    leftWall.position.x = -roomSize / 2;
    leftWall.position.y = wallHeight / 2;
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = createDistortedWall(roomSize, wallHeight, wallMaterial);
    rightWall.position.x = roomSize / 2;
    rightWall.position.y = wallHeight / 2;
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
}

function createDistortedWall(width, height, material) {
    const geometry = new THREE.PlaneGeometry(width, height, 20, 20);
    const positions = geometry.attributes.position;

    // Add subtle distortion to make walls feel "alive"
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const distortion = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.05;
        positions.setZ(i, distortion);
    }

    geometry.computeVertexNormals();
    const wall = new THREE.Mesh(geometry, material);
    wall.receiveShadow = true;
    wall.castShadow = true;
    return wall;
}

// ========== INTERACTIVE OBJECTS ==========
const interactables = [];

// 1. MIRROR
function createMirror() {
    const mirrorGroup = new THREE.Group();

    // Mirror frame
    const frameGeometry = new THREE.BoxGeometry(2.5, 3, 0.1);
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.7
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    mirrorGroup.add(frame);

    // Mirror surface (reflective)
    const mirrorGeometry = new THREE.PlaneGeometry(2.2, 2.7);
    const mirrorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x222222
    });
    const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    mirror.position.z = 0.06;
    mirrorGroup.add(mirror);

    mirrorGroup.position.set(-4.8, 2.5, 0);
    mirrorGroup.rotation.y = Math.PI / 2;
    scene.add(mirrorGroup);

    // Add to interactables
    interactables.push({
        object: mirrorGroup,
        type: 'mirror',
        name: 'Mirror',
        prompt: 'Press E to look into the mirror',
        triggerDistance: 2.5
    });

    return mirrorGroup;
}

// 2. CAT
function createCat() {
    const catGroup = new THREE.Group();

    // Cat body (simple geometric representation)
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.6);
    const catMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, catMaterial);
    body.position.y = 0.15;
    catGroup.add(body);

    // Cat head
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, catMaterial);
    head.position.set(0, 0.25, 0.35);
    head.scale.set(1, 1, 1.2);
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

    // Eye glow
    const eyeLight = new THREE.PointLight(0x00ff88, 0.5, 3);
    eyeLight.position.set(0, 0.3, 0.5);
    catGroup.add(eyeLight);

    // Hidden at first (appears in corner)
    catGroup.position.set(3.5, 0, 3.5);
    catGroup.visible = false; // Start invisible, will appear when player looks around
    scene.add(catGroup);

    interactables.push({
        object: catGroup,
        type: 'cat',
        name: 'Cat',
        prompt: 'Press E to approach the cat',
        triggerDistance: 3
    });

    return catGroup;
}

// 3. DOOR
function createDoor() {
    const doorGroup = new THREE.Group();

    // Door frame
    const frameGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.2);
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.7
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    doorGroup.add(frame);

    // Door itself
    const doorGeometry = new THREE.BoxGeometry(1.3, 2.3, 0.15);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.z = 0.1;
    doorGroup.add(door);

    // Light crack at bottom
    const crackGeometry = new THREE.PlaneGeometry(1.3, 0.05);
    const crackMaterial = new THREE.MeshBasicMaterial({
        color: 0xe6d7b2,
        transparent: true,
        opacity: 0.8
    });
    const crack = new THREE.Mesh(crackGeometry, crackMaterial);
    crack.position.set(0, -1.1, 0.16);
    doorGroup.add(crack);

    doorGroup.position.set(0, 1.25, -4.9);
    scene.add(doorGroup);

    interactables.push({
        object: doorGroup,
        type: 'door',
        name: 'Door',
        prompt: 'Press E to open the door',
        triggerDistance: 2
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

    // Trigger ending based on interaction type
    setTimeout(() => {
        if (type === 'mirror') {
            showEnding('mirror');
        } else if (type === 'cat') {
            showEnding('cat');
        } else if (type === 'door') {
            showEnding('door');
        }
    }, 500);
}

function showEnding(type) {
    const endingScreen = document.getElementById('ending-screen');
    const endingText = document.getElementById('ending-text');

    let text = '';

    if (type === 'mirror') {
        text = `You reach out and touch the cold glass.<br><br>
        Your reflection ripples like water...<br><br>
        And pulls you through.<br><br>
        You fall into darkness, only to find yourself standing in the same room again.<br><br>
        <span class="glitch">Did you ever really wake up?</span>`;
    } else if (type === 'cat') {
        text = `You move closer to the cat.<br><br>
        Its three eyes fix on you, unblinking.<br><br>
        Suddenly, it lunges—<br>
        A sharp hiss, claws extended.<br><br>
        You jolt awake in bed.<br><br>
        But when you look around...<br><br>
        <span class="glitch">The room looks exactly the same.</span>`;
    } else if (type === 'door') {
        text = `Each step echoes louder than the last.<br><br>
        Your heartbeat syncs with your footsteps.<br><br>
        You reach for the handle...<br><br>
        The door opens.<br><br>
        Blinding white light floods in.<br><br>
        Silence.<br><br>
        <span class="glitch">...But are you really awake?</span>`;
    }

    endingText.innerHTML = text;
    endingScreen.style.display = 'flex';

    // Release pointer lock
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
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

    if (gameState.started && !gameState.ended) {
        updateMovement(delta);
        checkInteractions();

        // Breathing light effect
        breathingLight.intensity = 0.5 + Math.sin(time * 0.5) * 0.2;
        breathingLight.position.copy(camera.position);

        // Animate particles
        particles.rotation.y += 0.0002;
        const positions = particles.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] += Math.sin(time + positions[i]) * 0.0005;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Mirror light flicker
        mirrorLight.intensity = 0.8 + Math.sin(time * 2) * 0.1;

        // Cat eye glow pulse
        if (cat.visible) {
            cat.children.forEach(child => {
                if (child instanceof THREE.Mesh && child.material.color.g > 0.5) {
                    child.material.opacity = 0.9 + Math.sin(time * 3) * 0.1;
                }
            });
        }

        // Door light flicker
        doorLight.intensity = 1.2 + Math.sin(time * 1.5) * 0.2;

        // Subtle wall breathing animation
        scene.traverse((object) => {
            if (object.userData.wall) {
                object.position.z = Math.sin(time * 0.3) * 0.02;
            }
        });
    }

    renderer.render(scene, camera);
}

animate();
