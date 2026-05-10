"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { roastStore, ROAST_PRESETS, type Roast } from "@/lib/roastStore";
import { preloaderStore } from "@/lib/preloaderStore";
import { Html } from "@react-three/drei";
import { motion } from "framer-motion";

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
  useLayoutEffect(() => {
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

function BeanMesh({
  materialRef,
}: {
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  const beanRef = useRef<THREE.Group>(null!);
  const bump = useNoiseTexture(256);
  const object = useLoader(OBJLoader, "/assets/Coffee Bean.obj");

  useFrame((_, delta) => {
    if (beanRef.current) beanRef.current.rotation.y += delta * 0.25;
  });

  // Default = medium roast preset (matches store initial state).
  const initial = ROAST_PRESETS.medium;
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: initial.color,
        roughness: initial.roughness,
        metalness: 0.06,
        bumpMap: bump ?? undefined,
        bumpScale: 0.03,
        envMapIntensity: 0.95,
      }),
    [initial.color, initial.roughness, bump],
  );

  useEffect(() => {
    materialRef.current = material;
    return () => {
      if (materialRef.current === material) materialRef.current = null;
    };
  }, [material, materialRef]);

  const { centeredBean, fitScale } = useMemo(() => {
    const clone = object.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    // Normalize OBJ dimensions so existing scrollytelling scales remain stable.
    const normalizedScale = 1 / maxAxis;

    clone.position.sub(center);
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = material;
    });
    return { centeredBean: clone, fitScale: normalizedScale * 1.9 };
  }, [object, material]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <group ref={beanRef} scale={fitScale}>
      {/* Base orientation correction: stand the imported bean upright. */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <primitive object={centeredBean} />
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
    rotY?: number;
    rotZ?: number;
  };
};

/**
 * Sections the bean travels through. Tuned for camera at (0,0,5) fov=40.
 * Positive X = right of viewport, negative X = left, negative Z = farther back.
 */
const WAYPOINTS: Waypoint[] = [
  // Hero: bean sits centered in the glow on the right.
  {
    trigger: "#home",
    start: "top top",
    end: "bottom 28%",
    to: { x: 1.75, y: -0.02, z: 0, scale: 1.52, rotX: Math.PI * 0.12, rotY: Math.PI * 0.08, rotZ: Math.PI * 0.02 },
  },
  // Hero -> Origin: smooth right-center to left-bottom glide.
  {
    trigger: "#origin",
    start: "top 92%",
    end: "center 66%",
    to: { x: -2.15, y: -1.02, z: -1.1, scale: 1.28, rotX: Math.PI * 0.44, rotY: Math.PI * 0.22, rotZ: Math.PI * 0.08 },
  },
  // Origin internal drift: keep moving, then leave a trigger gap before brews.
  {
    trigger: "#origin",
    start: "center 66%",
    end: "bottom 30%",
    to: { x: 0.75, y: -0.38, z: -0.85, scale: 1.05, rotX: Math.PI * 0.7, rotY: Math.PI * 0.34, rotZ: Math.PI * 0.18 },
  },
  // Brews: resumes after a gap and glides to the right side.
  {
    trigger: "#brews",
    start: "top 72%",
    end: "bottom top",
    to: { x: 2.85, y: -1.08, z: -1.35, scale: 0.72, rotX: Math.PI * 1.06, rotY: Math.PI * 0.56, rotZ: Math.PI * 0.28 },
  },
];

function AnimatedGroup() {
  const groupRef = useRef<THREE.Group>(null!);
  // Hero entry: scaled 0 → 1 once the Preloader fades out. Independent of
  // groupRef (scroll) and pulseRef (roast click) so the three animation
  // sources never overwrite each other — their scales multiply.
  const entryRef = useRef<THREE.Group>(null!);
  const pulseRef = useRef<THREE.Group>(null!);
  const mouseTiltRef = useRef<THREE.Group>(null!);
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
    let lastRoast: Roast = roastStore.get();
  
    const applyRoast = (r: Roast, pulse: boolean) => {
      const mat = materialRef.current;
      const target = ROAST_PRESETS[r];
      const targetColor = new THREE.Color(target.color);

      if (mat) {
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
          onUpdate: () => { mat.needsUpdate = true; },
        });
      }
      
      const glowColors = {
        light: "#f3c896",
        medium: "#e7b27e",
        dark: "#8b4513"
      };

      gsap.to("html", {
        "--accent": glowColors[r],
        duration: 1.2,
        ease: "power2.out"
      });

      if (pulse && pulseRef.current) {
        gsap.killTweensOf(pulseRef.current.scale);
        pulseRef.current.scale.setScalar(1);
        gsap.timeline()
          .to(pulseRef.current.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.2, ease: "power2.out" })
          .to(pulseRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      }
    };

    // Prime the material with the current roast (no pulse on mount).
    applyRoast(lastRoast, false);
    const unsub = roastStore.subscribe(() => {
      const r = roastStore.get();
      applyRoast(r, true);
      lastRoast = r;
    });
    return unsub;
  }, []);

  const activeRoast = roastStore.get();
  const flavors = {
    light: ["Floral", "Citrus", "Tea-like"],
    medium: ["Nutty", "Caramel", "Balanced"],
    dark: ["Bold", "Smoky", "Chocolate"]
  };

  <group ref={mouseTiltRef}>
    <BeanMesh materialRef={materialRef} />
    
    {/* Flavor Labels */}
    {flavors[activeRoast].map((note, i) => (
      <Html
        key={`${activeRoast}-${i}`}
        position={[i % 2 === 0 ? 1.2 : -1.2, (i - 1) * 0.5, 0]}
        center
        distanceFactor={10}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1, delay: i * 0.1 }}
          className="pointer-events-none whitespace-nowrap rounded-full border border-white/20 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-widest text-white backdrop-blur-md"
        >
          {note}
        </motion.div>
      </Html>
    ))}
  </group>

  useEffect(() => {
    const tilt = mouseTiltRef.current;
    if (!tilt) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        gsap.to(tilt.rotation, {
          x: ny * -0.14,
          y: nx * 0.18,
          duration: 1.1,
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

  useEffect(() => {
    if (!groupRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const g = groupRef.current;
    // Initial pose = first waypoint's "to"
    const first = WAYPOINTS[0].to;
    g.position.set(first.x, first.y, first.z ?? 0);
    g.scale.setScalar(first.scale ?? 1.6);
    g.rotation.set(first.rotX ?? 0, first.rotY ?? 0, first.rotZ ?? 0);

    const ctx = gsap.context(() => {
      WAYPOINTS.forEach((wp, i) => {
        const from = i === 0 ? WAYPOINTS[0].to : WAYPOINTS[i - 1].to;
        const sharedScroll = {
          trigger: wp.trigger,
          start: `${wp.start}+=10`,
          end: wp.end,
          scrub: 2,
          invalidateOnRefresh: true,
        } as const;

        gsap.fromTo(
          g.position,
          { x: from.x, y: from.y, z: from.z ?? 0 },
          {
            x: wp.to.x,
            y: wp.to.y,
            z: wp.to.z ?? 0,
            ease: "expo.out",
            overwrite: "auto",
            delay: 0.1,
            immediateRender: false,
            scrollTrigger: sharedScroll,
          },
        );

        const fromScale = from.scale ?? 1.6;
        const toScale = wp.to.scale ?? fromScale;
        gsap.fromTo(
          g.scale,
          { x: fromScale, y: fromScale, z: fromScale },
          {
            x: toScale,
            y: toScale,
            z: toScale,
            ease: "expo.out",
            overwrite: "auto",
            delay: 0.1,
            immediateRender: false,
            scrollTrigger: sharedScroll,
          },
        );

        gsap.fromTo(
          g.rotation,
          {
            x: from.rotX ?? g.rotation.x,
            y: from.rotY ?? g.rotation.y,
            z: from.rotZ ?? g.rotation.z,
          },
          {
            x: wp.to.rotX ?? g.rotation.x,
            y: wp.to.rotY ?? g.rotation.y,
            z: wp.to.rotZ ?? g.rotation.z,
            ease: "expo.out",
            overwrite: "auto",
            delay: 0.1,
            immediateRender: false,
            scrollTrigger: sharedScroll,
          },
        );
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
            <group ref={mouseTiltRef}>
              <BeanMesh materialRef={materialRef} />
            </group>
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
