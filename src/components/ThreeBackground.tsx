"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, Line } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

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

    return <NeuralNetwork isDark={isDark} />;
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
