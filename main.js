import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

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

    // Phase 1 (0-0.3): Move camera toward mirror, ripple effect
    if (progress < 0.3) {
        const phase = progress / 0.3;

        // Move camera toward mirror
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, -4.5, phase * 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0, phase * 0.05);

        // Make mirror ripple
        const mirrorSurface = mirror.children[1]; // The mirror plane
        const positions = mirrorSurface.geometry.attributes.position;
        if (!positions) {
            // Add segments to mirror for ripple effect
            const newGeo = new THREE.PlaneGeometry(2.2, 2.7, 30, 30);
            mirrorSurface.geometry = newGeo;
        }

        // Animate ripple
        const rippleGeo = mirrorSurface.geometry;
        const pos = rippleGeo.attributes.position;
        if (pos) {
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const dist = Math.sqrt(x * x + y * y);
                const ripple = Math.sin(dist * 3 - progress * 20) * 0.2 * phase;
                pos.setZ(i, ripple);
            }
            pos.needsUpdate = true;
            rippleGeo.computeVertexNormals();
        }

        // Mirror glows brighter
        mirrorLight.intensity = 0.8 + phase * 2;
    }

    // Phase 2 (0.3-0.6): Screen distortion, pull into darkness
    else if (progress < 0.6) {
        const phase = (progress - 0.3) / 0.3;

        // Screen shake
        camera.rotation.z = Math.sin(phase * 50) * 0.1 * (1 - phase);

        // Fade to black
        scene.background = new THREE.Color(
            Math.floor(0x0a * (1 - phase)),
            Math.floor(0x0a * (1 - phase)),
            Math.floor(0x0a * (1 - phase))
        );
        renderer.toneMappingExposure = 0.3 * (1 - phase);
    }

    // Phase 3 (0.6-1.0): Respawn in same room
    else {
        const phase = (progress - 0.6) / 0.4;

        if (phase < 0.01) {
            // Reset position
            camera.position.set(0, 1.6, 3);
            camera.rotation.z = 0;
        }

        // Fade back in
        const fadeIn = Math.min(phase * 2, 1);
        scene.background = new THREE.Color(
            Math.floor(0x0a * fadeIn),
            Math.floor(0x0a * fadeIn),
            Math.floor(0x0a * fadeIn)
        );
        renderer.toneMappingExposure = 0.3 * fadeIn;

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
            renderer.toneMappingExposure = 0.3 * (1 - fadeOut);
            camera.rotation.set(0, 0, 0);
        } else {
            // Reset and fade back in
            if (phase < 0.35) {
                camera.position.set(0, 1.6, 3);
                camera.rotation.set(0, 0, 0);
                cat.position.set(3.5, 0, 3.5);
                cat.scale.setScalar(1);
                cat.visible = true;
            }

            const fadeIn = (phase - 0.3) / 0.7;
            scene.background = new THREE.Color(
                Math.floor(0x0a * fadeIn),
                Math.floor(0x0a * fadeIn),
                Math.floor(0x0a * fadeIn)
            );
            renderer.toneMappingExposure = 0.3 * fadeIn;

            if (phase > 0.8) {
                showSubtleQuestion("Did I... wake up?");
            }
        }
    }
}

function animateDoorEnding(progress) {
    // Phase 1 (0-0.4): Door slowly opens
    if (progress < 0.4) {
        const phase = progress / 0.4;

        // Rotate door open
        const doorMesh = door.children[1]; // The door itself
        doorMesh.rotation.y = -phase * Math.PI * 0.7; // Swing open

        // Move camera slightly forward
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, -3.5, phase * 0.1);

        // Door light gets brighter as it opens
        doorLight.intensity = 1.2 + phase * 10;
    }

    // Phase 2 (0.4-0.7): Blinding white light floods in
    else if (progress < 0.7) {
        const phase = (progress - 0.4) / 0.3;

        // Increase light intensity dramatically
        doorLight.intensity = 11.2 + phase * 50;
        doorLight.distance = 8 + phase * 30;

        // Fade scene to white
        const whiteAmount = phase * 255;
        scene.background = new THREE.Color(
            Math.floor(whiteAmount),
            Math.floor(whiteAmount),
            Math.floor(whiteAmount)
        );

        // Increase exposure
        renderer.toneMappingExposure = 0.3 + phase * 3;

        // Everything fades to white
        scene.fog.color = new THREE.Color(
            Math.floor(0x0b + whiteAmount),
            Math.floor(0x0b + whiteAmount),
            Math.floor(0x0b + whiteAmount)
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
            renderer.toneMappingExposure = 3 * darkness + 0.3 * fadeBack;
            scene.fog.color = new THREE.Color(0x0b0b0b);

            // Reset
            if (fadeBack > 0.5 && fadeBack < 0.55) {
                camera.position.set(0, 1.6, 3);
                door.children[1].rotation.y = 0;
                doorLight.intensity = 1.2;
                doorLight.distance = 8;
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
                if (child instanceof THREE.Mesh && child.material.color && child.material.color.g > 0.5) {
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
