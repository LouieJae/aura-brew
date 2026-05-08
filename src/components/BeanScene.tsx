"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { roastStore, ROAST_PRESETS, type Roast } from "@/lib/roastStore";
import { preloaderStore } from "@/lib/preloaderStore";

/**
 * Generates a tileable grayscale noise texture on a canvas. Used as a bumpMap
 * to fake the micro-pitting / pore structure of a roasted coffee bean.
 */
/**
 * Soft radial-gradient circle on a canvas, used as the point sprite for
 * coffee-dust particles. Generated once on mount.
 */
function useSoftCircleTexture(size = 64) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const cx = size / 2;
    const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.4, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    setTex(t);
    return () => t.dispose();
  }, [size]);
  return tex;
}

/**
 * Coffee-dust: ~2500 points scattered in a wide volume behind the bean.
 * Wrapped in an outer group whose position is tweened by GSAP from mouse
 * coords for a subtle parallax. The points sit in z ≤ -3 so they never clip
 * the bean (which lives in z ∈ [-1.5, 0]).
 */
function CoffeeDust() {
  const sprite = useSoftCircleTexture(64);
  const groupRef = useRef<THREE.Group>(null!);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  // Build the buffer geometry once on mount. Math.random() lives inside an
  // effect so it's not flagged as impure during render.
  useEffect(() => {
    const COUNT = 2500;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Wide horizontal spread, modest vertical, deep z behind the bean.
      positions[i * 3 + 0] = (Math.random() - 0.5) * 24; // x: -12..12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16; // y: -8..8
      positions[i * 3 + 2] = -3 - Math.random() * 9;     // z: -3..-12
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    setGeometry(g);
    return () => g.dispose();
  }, []);

  // Lazy gentle drift on the wrapper so the dust feels alive even at rest.
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.05) * 0.02;
  });

  // Mouse parallax: GSAP tweens groupRef.position toward a normalized mouse
  // offset with a noticeable lag for organic feel.
  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;  // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!groupRef.current) return;
        gsap.to(groupRef.current.position, {
          x: nx * 0.6,
          y: -ny * 0.4,
          duration: 1.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!geometry || !sprite) return null;

  return (
    <group ref={groupRef}>
      <points geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          map={sprite}
          color="#d2b48c"
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function useNoiseTexture(size = 256) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      // Two-octave noise: fine grain + larger pits.
      const fine = Math.random();
      const coarse = Math.random() * Math.random();
      const v = Math.floor((fine * 0.55 + coarse * 0.45) * 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    t.anisotropy = 4;
    t.needsUpdate = true;
    // One-shot setup of an external (WebGL) resource — safe to set once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTex(t);
    return () => t.dispose();
  }, [size]);
  return tex;
}

/**
 * Placeholder coffee-bean: a sphere lit with PBR + procedural bump.
 * Idle Y rotation runs every frame; scroll-driven X/Z rotation + position
 * are applied externally via the parent group ref.
 *
 * `materialRef` is lifted so the parent can GSAP-tween color + roughness when
 * the roast changes.
 */
function BeanMesh({
  materialRef,
}: {
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const bump = useNoiseTexture(256);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.25;
  });

  // Default = medium roast preset (matches store initial state).
  const initial = ROAST_PRESETS.medium;

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[1, 96, 96]} />
      <meshStandardMaterial
        ref={materialRef}
        color={initial.color}
        roughness={initial.roughness}
        metalness={0.05}
        bumpMap={bump ?? undefined}
        bumpScale={0.06}
        envMapIntensity={0.9}
      />
    </mesh>
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
  // Hero entry: scaled 0 → 1 once the Preloader fades out. Independent of
  // groupRef (scroll) and pulseRef (roast click) so the three animation
  // sources never overwrite each other — their scales multiply.
  const entryRef = useRef<THREE.Group>(null!);
  const pulseRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Hero entry animation, gated on Preloader completion.
  useEffect(() => {
    const run = () => {
      const e = entryRef.current;
      if (!e) return;
      gsap.killTweensOf(e.scale);
      e.scale.setScalar(0);
      gsap.to(e.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.4,
        ease: "elastic.out(1, 0.6)",
        delay: 0.15,
      });
    };
    if (preloaderStore.isDone()) {
      run();
      return;
    }
    const unsub = preloaderStore.subscribe(() => {
      if (preloaderStore.isDone()) {
        run();
        unsub();
      }
    });
    return unsub;
  }, []);

  // Roast -> material (color, roughness) + pulse on every set.
  useEffect(() => {
    // Read store imperatively so this effect never re-runs from React state;
    // we subscribe directly and tween with GSAP.
    let lastRoast: Roast = roastStore.get();

    const applyRoast = (r: Roast, pulse: boolean) => {
      const mat = materialRef.current;
      const target = ROAST_PRESETS[r];
      const targetColor = new THREE.Color(target.color);

      if (mat) {
        // Tween the color channels via a proxy object so GSAP can ease them.
        gsap.to(mat.color, {
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b,
          duration: 0.9,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(mat, {
          roughness: target.roughness,
          duration: 0.9,
          ease: "power2.out",
          overwrite: "auto",
          onUpdate: () => {
            mat.needsUpdate = true;
          },
        });
      }

      if (pulse && pulseRef.current) {
        // Kill any in-flight pulse, then bump the inner group out + back.
        gsap.killTweensOf(pulseRef.current.scale);
        pulseRef.current.scale.setScalar(1);
        gsap
          .timeline()
          .to(pulseRef.current.scale, {
            x: 1.18,
            y: 1.18,
            z: 1.18,
            duration: 0.22,
            ease: "power2.out",
          })
          .to(pulseRef.current.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.55,
            ease: "elastic.out(1, 0.45)",
          });
      }
    };

    // Prime the material with the current roast (no pulse on mount).
    applyRoast(lastRoast, false);

    const unsub = roastStore.subscribe(() => {
      const r = roastStore.get();
      // Always pulse on a click (even if roast matches); tick bumps regardless.
      applyRoast(r, true);
      lastRoast = r;
    });
    return unsub;
  }, []);

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
        <group ref={entryRef} scale={0}>
          <group ref={pulseRef}>
            <BeanMesh materialRef={materialRef} />
          </group>
        </group>
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

        {/* Coffee-dust particles — mounted before the bean so they render
            behind it; their z range (≤ -3) keeps them well clear of clipping. */}
        <CoffeeDust />

        <AnimatedGroup />

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
