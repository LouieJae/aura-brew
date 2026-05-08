"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useMatcapTexture, Environment } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function BeanMesh({ scale = 1.6 }: { scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  // Warm brown matcap, evoking a roasted coffee bean.
  // Hash IDs come from the nidorx/matcaps repo used by drei's useMatcapTexture.
  const [matcap] = useMatcapTexture("7B5254_E9DCC7_B19986_C8AC91", 512);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.25;
  });

  return (
    <mesh ref={meshRef} scale={scale} castShadow>
      <sphereGeometry args={[1, 64, 64]} />
      <meshMatcapMaterial matcap={matcap as THREE.Texture} />
    </mesh>
  );
}

type CoffeeBeanProps = {
  groupRef?: React.MutableRefObject<THREE.Group | null>;
};

export default function CoffeeBean({ groupRef }: CoffeeBeanProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, -3, -2]} intensity={0.4} color="#e7b27e" />
      <Environment preset="sunset" />
      <Float
        speed={1.4}
        rotationIntensity={0.6}
        floatIntensity={1.2}
        floatingRange={[-0.15, 0.15]}
      >
        <group ref={(g) => {
          if (groupRef) groupRef.current = g;
        }}>
          <BeanMesh />
        </group>
      </Float>
    </Canvas>
  );
}
