"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Box, Sphere, Line } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

// --- Robot & Treadmill Components ---

function Robot({ isDark }: { isDark: boolean }) {
    const group = useRef<THREE.Group>(null);
    const leftArm = useRef<THREE.Mesh>(null);
    const rightArm = useRef<THREE.Mesh>(null);
    const leftLeg = useRef<THREE.Mesh>(null);
    const rightLeg = useRef<THREE.Mesh>(null);

    const robotColor = isDark ? "#60a5fa" : "#3b82f6";
    const jointColor = isDark ? "#94a3b8" : "#64748b";

    useFrame((state) => {
        const t = state.clock.getElapsedTime() * 12; // Faster jogging

        if (group.current) {
            group.current.position.y = Math.sin(t * 2) * 0.05;
        }

        if (leftArm.current && rightArm.current && leftLeg.current && rightLeg.current) {
            leftArm.current.rotation.x = Math.sin(t) * 0.6;
            rightArm.current.rotation.x = Math.cos(t) * 0.6;
            leftLeg.current.rotation.x = Math.cos(t) * 0.6;
            rightLeg.current.rotation.x = Math.sin(t) * 0.6;
        }
    });

    return (
        <group ref={group} position={[0, 0.5, 0]}>
            {/* Head */}
            <Box args={[0.4, 0.4, 0.4]} position={[0, 0.7, 0]}>
                <meshStandardMaterial color={robotColor} />
            </Box>
            {/* Eyes */}
            <Box args={[0.08, 0.05, 0.05]} position={[-0.1, 0.75, 0.2]}>
                <meshStandardMaterial color="white" />
            </Box>
            <Box args={[0.08, 0.05, 0.05]} position={[0.1, 0.75, 0.2]}>
                <meshStandardMaterial color="white" />
            </Box>

            {/* Body */}
            <Box args={[0.5, 0.6, 0.3]} position={[0, 0.2, 0]}>
                <meshStandardMaterial color={robotColor} />
            </Box>
            <Text
                position={[0, 0.2, 0.16]}
                fontSize={0.1}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                GPT-0.5
            </Text>

            {/* Arms */}
            <group position={[-0.35, 0.4, 0]}>
                <Box ref={leftArm} args={[0.15, 0.5, 0.15]} position={[0, -0.2, 0]}>
                    <meshStandardMaterial color={jointColor} />
                </Box>
            </group>
            <group position={[0.35, 0.4, 0]}>
                <Box ref={rightArm} args={[0.15, 0.5, 0.15]} position={[0, -0.2, 0]}>
                    <meshStandardMaterial color={jointColor} />
                </Box>
            </group>

            {/* Legs */}
            <group position={[-0.15, -0.1, 0]}>
                <Box ref={leftLeg} args={[0.15, 0.6, 0.15]} position={[0, -0.3, 0]}>
                    <meshStandardMaterial color={jointColor} />
                </Box>
            </group>
            <group position={[0.15, -0.1, 0]}>
                <Box ref={rightLeg} args={[0.15, 0.6, 0.15]} position={[0, -0.3, 0]}>
                    <meshStandardMaterial color={jointColor} />
                </Box>
            </group>
        </group>
    );
}

function Treadmill({ isDark }: { isDark: boolean }) {
    const baseColor = isDark ? "#334155" : "#cbd5e1";
    const beltColor = isDark ? "#1e293b" : "#94a3b8";

    return (
        <group position={[0, -0.5, 0]}>
            <Box args={[1.5, 0.1, 2]} position={[0, 0, 0]}>
                <meshStandardMaterial color={baseColor} />
            </Box>
            <Box args={[1.2, 0.11, 1.8]} position={[0, 0.01, 0]}>
                <meshStandardMaterial color={beltColor} />
            </Box>
            <Box args={[0.1, 1, 0.1]} position={[0.6, 0.5, 0.9]} rotation={[-0.2, 0, 0]}>
                <meshStandardMaterial color={baseColor} />
            </Box>
            <Box args={[0.1, 1, 0.1]} position={[-0.6, 0.5, 0.9]} rotation={[-0.2, 0, 0]}>
                <meshStandardMaterial color={baseColor} />
            </Box>
            <group position={[0, 1, 0.8]} rotation={[-0.3, 0, 0]}>
                <Box args={[1, 0.4, 0.1]}>
                    <meshStandardMaterial color={baseColor} />
                </Box>
                <Text
                    position={[0, 0.05, 0.06]}
                    fontSize={0.08}
                    color={isDark ? "#60a5fa" : "#2563eb"}
                    anchorX="center"
                    anchorY="middle"
                >
                    Training Model...
                </Text>
                <Text
                    position={[0, -0.08, 0.06]}
                    fontSize={0.12}
                    color={isDark ? "#ef4444" : "#dc2626"}
                    anchorX="center"
                    anchorY="middle"
                >
                    99%
                </Text>
            </group>
        </group>
    );
}

// --- Movement Logic ---

function MovingPlatform({ isDark }: { isDark: boolean }) {
    const group = useRef<THREE.Group>(null);
    const { viewport } = useThree();

    useFrame((state) => {
        if (!group.current) return;

        const t = state.clock.getElapsedTime() * 0.5;

        const width = viewport.width / 2 - 2;
        const height = viewport.height / 2 - 2;

        const angle = t;
        const clampedX = Math.max(-width, Math.min(width, Math.cos(angle) * width * 1.5));
        const clampedY = Math.max(-height, Math.min(height, Math.sin(angle) * height * 1.5));

        group.current.position.set(clampedX, clampedY, 0);
        group.current.rotation.y = Math.sin(t) * 0.2;
        group.current.rotation.z = Math.cos(t) * 0.05;
    });

    return (
        <group ref={group} scale={0.6}>
            <Robot isDark={isDark} />
            <Treadmill isDark={isDark} />
        </group>
    );
}

// --- Neural Network Mesh ---

interface NodeData {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
}

function NeuralNetwork({ isDark }: { isDark: boolean }) {
    const count = 30;
    const { viewport } = useThree();

    // Initialize nodes with random positions and velocities
    const nodesData = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * viewport.width,
                (Math.random() - 0.5) * viewport.height,
                (Math.random() - 0.5) * 5 - 5 // Z range -7.5 to -2.5
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.01
            )
        }));
    }, [viewport]);

    const [lines, setLines] = useState<THREE.Vector3[][]>([]);
    const spheresRef = useRef<(THREE.Mesh | null)[]>([]);

    useFrame(() => {
        const newLines: THREE.Vector3[][] = [];

        // Update positions
        nodesData.forEach((node, i) => {
            node.position.add(node.velocity);

            // Bounce off walls (viewport bounds)
            const halfWidth = viewport.width / 2;
            const halfHeight = viewport.height / 2;

            if (Math.abs(node.position.x) > halfWidth) node.velocity.x *= -1;
            if (Math.abs(node.position.y) > halfHeight) node.velocity.y *= -1;
            if (node.position.z > -2 || node.position.z < -10) node.velocity.z *= -1;

            // Update sphere mesh position directly
            if (spheresRef.current[i]) {
                spheresRef.current[i]!.position.copy(node.position);
            }
        });

        // Re-calculate lines
        // Optimization: Only check some neighbors or use a simpler distance check
        // For 30 nodes, N^2 is 900 checks, which is fine for 60fps
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dist = nodesData[i].position.distanceTo(nodesData[j].position);
                if (dist < 4) {
                    newLines.push([nodesData[i].position, nodesData[j].position]);
                }
            }
        }

        // We can't easily update Line component props without re-render.
        // But re-rendering 30 lines every frame might be heavy.
        // Let's try setting state. If it lags, we switch to a single LineSegments geometry.
        setLines(newLines);
    });

    const nodeColor = isDark ? "#60a5fa" : "#3b82f6";
    const lineColor = isDark ? "#94a3b8" : "#cbd5e1";

    return (
        <group>
            {nodesData.map((node, i) => (
                <Sphere
                    key={i}
                    ref={(el) => { spheresRef.current[i] = el; }}
                    args={[0.1, 16, 16]}
                    position={node.position}
                >
                    <meshStandardMaterial color={nodeColor} opacity={0.6} transparent />
                </Sphere>
            ))}
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={line}
                    color={lineColor}
                    lineWidth={1}
                    transparent
                    opacity={0.2}
                />
            ))}
        </group>
    );
}

// --- Main Component ---

function Scene() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <>
            <NeuralNetwork isDark={isDark} />
            <MovingPlatform isDark={isDark} />
        </>
    );
}

export default function ThreeBackground() {
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: -1,
                pointerEvents: "none",
                opacity: 1,
            }}
        >
            <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                <Scene />
            </Canvas>
        </div>
    );
}
