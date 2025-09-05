"use client";

import dynamic from "next/dynamic";
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Environment } from "@react-three/drei";

type Units = "px" | "rem" | "vw" | "vh";

type Props = {
  size?: number;
  unit?: Units;
  x?: number; y?: number; right?: number; bottom?: number;
  baseEnergy?: number;
  speed?: number;
  opacity?: number;
  micReactive?: boolean;
  bloomIntensity?: number;      // 0.0–3.0
  hdrPreset?: "night" | "city" | "dawn" | "sunset" | "warehouse" | "studio" | "forest" | "apartment" | "lobby";
  background?: string;          // CSS bg del wrapper
  label?: string;
};

export default function VoiceOrbThreePro({
  size = 520,
  unit = "px",
  x, y, right, bottom,
  baseEnergy = 0.6,
  speed = 1,
  opacity = 1,
  micReactive = false,
  bloomIntensity = 1.2,
  hdrPreset = "night",
  background = "radial-gradient(1200px 800px at 70% 20%, #061a3a 0%, #081129 45%, #050a18 100%)",
  label = "Voice AI Motion Orb (Three PRO)",
}: Props) {
  /** ---------- energía (micrófono / autónomo) ---------- */
  const [energy, setEnergy] = useState(baseEnergy);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let mounted = true;

    const idle = () => {
      const t0 = performance.now();
      const tick = () => {
        if (!mounted) return;
        const t = (performance.now() - t0) / 1000;
        const e = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.5 * speed));
        setEnergy(e);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
          video: false,
        });
        const Ctx: any = window.AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctx();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.85;
        ctx.createMediaStreamSource(stream).connect(analyser);

        const timeData = new Uint8Array(analyser.fftSize);

        const tick = () => {
          if (!mounted) return;
          analyser.getByteTimeDomainData(timeData);
          let sum = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / timeData.length);
          const norm = Math.min(1, Math.max(0, (rms - 0.02) / 0.28));
          const curved = Math.pow(norm, 0.85);
          setEnergy((prev) => prev + (curved - prev) * 0.2);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        idle();
      }
    };

    if (micReactive && typeof navigator !== "undefined" && navigator.mediaDevices) startMic();
    else idle();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { audioCtxRef.current?.close(); } catch {}
      mounted = false;
    };
  }, [micReactive, speed]);

  /** ---------- layout ---------- */
  const absolutePos: CSSProperties =
    x !== undefined || y !== undefined || right !== undefined || bottom !== undefined
      ? {
          position: "absolute",
          left: x !== undefined ? `${x}${unit}` : undefined,
          top: y !== undefined ? `${y}${unit}` : undefined,
          right: right !== undefined ? `${right}${unit}` : undefined,
          bottom: bottom !== undefined ? `${bottom}${unit}` : undefined,
        }
      : {};

  return (
    <figure
      aria-label={label}
      role="img"
      style={{
        width: `${size}${unit}`,
        height: `${size}${unit}`,
        ...absolutePos,
        opacity,
        display: "grid",
        placeItems: "center",
        background,
        borderRadius: 16,
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <OrbCanvas energy={energy} speed={speed} bloomIntensity={bloomIntensity} hdrPreset={hdrPreset} />

      {/* glow lateral púrpura (como el mock) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-12%",
          top: "50%",
          transform: "translateY(-50%)",
          width: `calc(${size}${unit} * 0.35)`,
          height: `calc(${size}${unit} * 0.35)`,
          borderRadius: "999px",
          background: "radial-gradient(60% 60% at 50% 50%, rgba(200,60,255,0.35), rgba(0,0,0,0))",
          filter: "blur(32px)",
          opacity: 0.55 * opacity,
          pointerEvents: "none",
        }}
      />
    </figure>
  );
}

/* =================== escena R3F con Bloom + HDRI =================== */

function OrbCanvas({
  energy, speed, bloomIntensity, hdrPreset,
}: { energy: number; speed: number; bloomIntensity: number; hdrPreset: Props["hdrPreset"] }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 2.1], fov: 35 }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Entorno HDRI: aporta reflejos al vidrio */}
      <Environment preset={hdrPreset} background={false} />

      {/* Luces suaves */}
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 2, 3]} intensity={0.45} color={"#9fdcff"} />
      <pointLight position={[-2, 0.5, 1]} intensity={0.25} color={"#55ccff"} />

      {/* Orb (núcleo shader) + cúpula de vidrio físico para reflejos */}
      <group>
        <CoreOrb energy={energy} speed={speed} />
        <GlassShell />
        {/* sombra suave bajo la esfera */}
        <mesh position={[0, -0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.55, 64]} />
          <meshBasicMaterial color={"#142850"} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Post-procesado */}
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.1}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.35} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}

/** Núcleo con shader (degradado, micro-textura, Fresnel, energía) */
function CoreOrb({ energy, speed }: { energy: number; speed: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: energy },
      uSpeed: { value: speed },
      uColorA: { value: new THREE.Color("#32E4FF") },
      uColorB: { value: new THREE.Color("#1558FF") },
      uDeep:  { value: new THREE.Color("#0C2E84") },
      uOpacity:{ value: 0.9 },
    }),
    []
  );

  useFrame((_s, dt) => {
    materialRef.current.uniforms.uTime.value += dt;
    materialRef.current.uniforms.uEnergy.value = energy;
    materialRef.current.uniforms.uSpeed.value = speed;
  });

  const vertex = /* glsl */`
    varying vec3 vNormal;
    varying vec3 vWorld;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;

  const fragment = /* glsl */`
    precision highp float;
    uniform float uTime, uEnergy, uSpeed, uOpacity;
    uniform vec3 uColorA, uColorB, uDeep;
    varying vec3 vNormal;
    varying vec3 vWorld;

    float hash(vec3 p){
      p = fract(p*0.3183099 + vec3(0.1,0.2,0.3));
      p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
    }
    float noise(vec3 x){
      vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
      float n = mix(
        mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
      return n;
    }
    float fbm(vec3 p){
      float v=0.0, a=0.5;
      for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.0+vec3(100.0); a*=0.5; }
      return v;
    }
    float micro(vec3 p){
      float s1 = 0.5 + 0.5*cos(80.0*p.x);
      float s2 = 0.5 + 0.5*cos(80.0*p.y + 1.57);
      float g  = s1*s2;
      return pow(g, 4.0);
    }

    void main(){
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vWorld);

      float fres = pow(1.0 - clamp(dot(N,V),0.0,1.0), 2.0);

      vec3 L = normalize(vec3(-0.6, 0.25, 0.1));
      float NdotL = clamp(dot(N,L), 0.0, 1.0);

      float t = uTime * (0.65 + 0.85*uSpeed);
      vec3  p = vWorld;
      vec3  warp = vec3(
        fbm(p*1.2 + vec3(0.0,0.0,t*0.35)),
        fbm(p*1.2 + vec3(11.0,7.0,t*0.35)),
        fbm(p*1.2 + vec3(-4.0,15.0,t*0.35))
      );
      float w = (0.15 + 0.55*uEnergy);
      vec3 q = p + warp*(0.35 + 0.65*w);

      float mp = micro(q);
      float swirl = fbm(q*1.1 + vec3(0.0,0.0,t*0.15));

      vec3 base = mix(uDeep, mix(uColorB, uColorA, NdotL*0.8+0.1), 0.85);
      float spec = pow(max(dot(reflect(-L,N), V), 0.0), 64.0);

      vec3 col = base;
      col += mp    * vec3(0.22,0.78,1.0) * (0.5 + 1.1*uEnergy);
      col += swirl * vec3(0.10,0.40,0.9) * (0.35 + 0.9*uEnergy);
      col += fres  * vec3(0.20,0.72,1.0) * (0.6 + 0.9*uEnergy);
      col += spec  * vec3(1.0);

      col = clamp(col, 0.0, 1.5);
      gl_FragColor = vec4(col, uOpacity);
    }
  `;

  return (
    <mesh>
      <sphereGeometry args={[1, 192, 192]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms as any}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Capa de vidrio físicamente realista (para reflejos HDRI) */
function GlassShell() {
  return (
    <mesh scale={1.005}>
      <sphereGeometry args={[1, 128, 128]} />
      <meshPhysicalMaterial
        transmission={1}      // efecto vidrio
        thickness={0.4}
        roughness={0.05}
        metalness={0}
        reflectivity={0.9}
        clearcoat={1}
        clearcoatRoughness={0.06}
        ior={1.35}
        attenuationColor={"#7fd8ff"}
        attenuationDistance={2.5}
        transparent
      />
    </mesh>
  );
}