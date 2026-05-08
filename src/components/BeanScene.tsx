"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const MODEL_URL = "/assets/10177_CoffeeBean_v01_it2.obj";
const TEXTURE_URL = "/assets/CoffeeBean_v01.jpg";

/**
 * Real coffee-bean OBJ from /public/assets, textured with CoffeeBean_v01.jpg.
 *
 * The source model is Z-up and uses real-world cm units, so we:
 *   1) clone the OBJ scene per-instance,
 *   2) replace every sub-material with a PBR MeshStandardMaterial that uses
 *      the jpg as its color map (the .mtl ships only diffuse),
 *   3) compute a bounding sphere to recenter + normalize to ~unit radius,
 *   4) rotate -PI/2 on X to convert Z-up → Y-up.
 *
 * Idle Y-rotation runs every frame; scroll-driven X/Z rotation + position
 * are applied externally via the parent group ref.
 */
function BeanModel() {
  const obj = useLoader(OBJLoader, MODEL_URL);
  // Configure colorSpace + anisotropy in the load callback (mutating a hook
  // return value during render is flagged by the React Compiler).
  const colorMap = useTexture(TEXTURE_URL, (t) => {
    const tex = t as THREE.Texture;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
  });
  const innerRef = useRef<THREE.Group>(null!);

  // Clone + remap materials once. Center + normalize scale via bounding sphere.
  const prepared = useMemo(() => {
    const root = obj.clone(true);

    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = new THREE.MeshStandardMaterial({
          map: colorMap,
          roughness: 0.7,
          metalness: 0.05,
          envMapIntensity: 0.85,
        });
      }
    });

    // Recenter on origin and scale so the longest axis ≈ 1.6 units.
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const target = 1.6;
    root.position.sub(center);
    root.scale.setScalar(target / maxDim);

    return root;
  }, [obj, colorMap]);

  useFrame((_, delta) => {
    if (innerRef.current) innerRef.current.rotation.y += delta * 0.25;
  });

  return (
    // Outer rotation converts the model's Z-up authoring to Y-up so the
    // bean lies flat (long axis horizontal) instead of standing on its tip.
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={innerRef}>
        <primitive object={prepared} />
      </group>
    </group>
  );
}

type Waypoint = {
  /** CSS selector for the section that drives this leg */
  trigger: string;
  start: string;
  end: string;
  /** Target transform for the bean group at the END of the leg */
  to: {
    x: number;
    y: number;
    z?: number;
    scale?: number;
    rotX?: number;
    rotZ?: number;
  };
};

/**
 * Sections the bean travels through. Tuned for camera at (0,0,5) fov=40.
 * Positive X = right of viewport, negative X = left, negative Z = farther back.
 */
const WAYPOINTS: Waypoint[] = [
  // Hero: bean rests on the right
  {
    trigger: "#home",
    start: "top top",
    end: "bottom top",
    to: { x: 2.0, y: -0.6, z: 0, scale: 1.6, rotX: Math.PI * 0.6, rotZ: Math.PI * 0.2 },
  },
  // Origin: bean glides behind the text on the LEFT side
  {
    trigger: "#origin",
    start: "top bottom",
    end: "center center",
    to: { x: -2.4, y: 0, z: -1.2, scale: 1.4, rotX: Math.PI * 1.2, rotZ: Math.PI * 0.6 },
  },
  // Origin → Brews handoff: bean drifts up-right and shrinks
  {
    trigger: "#origin",
    start: "center center",
    end: "bottom top",
    to: { x: 2.6, y: 1.2, z: -0.5, scale: 0.9, rotX: Math.PI * 1.8, rotZ: Math.PI * 0.9 },
  },
  // Brews: bean tucks in the upper right, smaller, behind cards
  {
    trigger: "#brews",
    start: "top bottom",
    end: "bottom top",
    to: { x: 3.2, y: -1.4, z: -1.5, scale: 0.7, rotX: Math.PI * 2.6, rotZ: Math.PI * 1.4 },
  },
];

function AnimatedGroup() {
  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (!groupRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const g = groupRef.current;
    // Initial pose = first waypoint's "to"
    const first = WAYPOINTS[0].to;
    g.position.set(first.x, first.y, first.z ?? 0);
    g.scale.setScalar(first.scale ?? 1.6);
    g.rotation.set(0, 0, 0);

    const ctx = gsap.context(() => {
      WAYPOINTS.forEach((wp) => {
        gsap.to(g.position, {
          x: wp.to.x,
          y: wp.to.y,
          z: wp.to.z ?? 0,
          ease: "none",
          scrollTrigger: {
            trigger: wp.trigger,
            start: wp.start,
            end: wp.end,
            scrub: 0.6,
          },
        });
        if (wp.to.scale !== undefined) {
          gsap.to(g.scale, {
            x: wp.to.scale,
            y: wp.to.scale,
            z: wp.to.scale,
            ease: "none",
            scrollTrigger: {
              trigger: wp.trigger,
              start: wp.start,
              end: wp.end,
              scrub: 0.6,
            },
          });
        }
        if (wp.to.rotX !== undefined || wp.to.rotZ !== undefined) {
          gsap.to(g.rotation, {
            x: wp.to.rotX ?? g.rotation.x,
            z: wp.to.rotZ ?? g.rotation.z,
            ease: "none",
            scrollTrigger: {
              trigger: wp.trigger,
              start: wp.start,
              end: wp.end,
              scrub: 0.6,
            },
          });
        }
      });
    });

    // Refresh after R3F mounts so triggers measure correct positions.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(id);
      ctx.revert();
    };
  }, []);

  return (
    <Float
      speed={1.4}
      rotationIntensity={0.4}
      floatIntensity={0.9}
      floatingRange={[-0.12, 0.12]}
    >
      <group ref={groupRef}>
        <BeanModel />
      </group>
    </Float>
  );
}

/**
 * Fixed full-viewport 3D layer. Sits behind page content (z-0) and is
 * pointer-events-none so it never blocks UI.
 */
export default function BeanScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ contain: "strict" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Soft ambient + a warm key + a cool rim for that studio-product feel */}
        <ambientLight intensity={0.35} />
        <directionalLight
          castShadow
          position={[4, 6, 4]}
          intensity={1.4}
          color="#fff1dc"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, -2, -3]} intensity={0.5} color="#9bb6ff" />
        <directionalLight position={[0, -4, 2]} intensity={0.3} color="#e7b27e" />

        {/* Studio HDRI gives the bean PBR reflections + sheen */}
        <Environment preset="studio" />

        {/* Suspense waits on OBJ + texture loaders; nothing renders until ready */}
        <Suspense fallback={null}>
          <AnimatedGroup />
        </Suspense>

        {/* Soft contact shadow on the floor plane below the bean */}
        <ContactShadows
          position={[0, -1.6, 0]}
          opacity={0.55}
          scale={10}
          blur={2.6}
          far={4}
          resolution={512}
          color="#1a0c06"
        />
      </Canvas>
    </div>
  );
}
