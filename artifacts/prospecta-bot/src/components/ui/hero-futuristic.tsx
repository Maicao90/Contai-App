"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAspect, useTexture } from "@react-three/drei";
import React, { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

const TEXTUREMAP = { src: "/brain-texture.png" };
const DEPTHMAP = { src: "/brain-depth.webp" };

// Shader customizado para efeito de profundidade e brilho esmeralda estável
const BrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uTime: { value: 0 },
    uOpacity: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uMouse;
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      vec4 depthSample = texture2D(tDepth, vUv);
      float depth = depthSample.r;
      
      // Efeito de movimento baseado na profundidade e mouse
      vec2 parallax = uMouse * depth * 0.015;
      vec2 uv = vUv + parallax;
      
      vec4 color = texture2D(tDiffuse, uv);
      
      // Efeito de pulso esmeralda (#10b981)
      float pulse = (sin(uTime * 0.8) * 0.5 + 0.5) * 0.15;
      float scanline = smoothstep(0.48, 0.5, 0.5 + 0.5 * sin(vUv.y * 20.0 + uTime * 2.0));
      
      vec3 emerald = vec3(0.06, 0.72, 0.50);
      color.rgb += emerald * pulse * depth;
      color.rgb += emerald * scanline * 0.05 * depth;
      
      gl_FragColor = vec4(color.rgb, color.a * uOpacity);
    }
  `,
};

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (rawMap && depthMap) {
      setVisible(true);
    }
  }, [rawMap, depthMap]);

  const shaderArgs = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      ...BrainShader,
      transparent: true,
      depthTest: false,
    });
    m.uniforms.tDiffuse.value = rawMap;
    m.uniforms.tDepth.value = depthMap;
    return m;
  }, [rawMap, depthMap]);

  const [w, h] = useAspect(300, 300);

  useFrame((state) => {
    const { clock, pointer } = state;
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = clock.getElapsedTime();
      mat.uniforms.uMouse.value.lerp(pointer, 0.1);
      
      // Lerp de opacidade mais rápido (0.1 em vez de 0.05) para evitar desaparecimento
      mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        mat.uniforms.uOpacity.value,
        visible ? 1 : 0,
        0.1
      );
    }
  });

  const { size } = useThree();
  const isMobile = size.width < 768;
  const scaleFactor = isMobile ? 0.6 : 0.4;
  
  return (
    <mesh ref={meshRef} scale={[w * scaleFactor, h * scaleFactor, 1]} material={shaderArgs}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

export function HeroFuturistic() {
  const titleWords = "CÉREBRO INTELIGENTE CONTROLADOR".split(" ");
  const subtitle = "24hrs por dia calculando, organizando e avisando direto no WhatsApp.";
  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);
  const [subtitleDelay, setSubtitleDelay] = useState(0);

  useEffect(() => {
    setDelays(titleWords.map(() => Math.random() * 0.07));
    setSubtitleDelay(Math.random() * 0.1);
  }, [titleWords.length]);

  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const timeout = setTimeout(() => setVisibleWords(visibleWords + 1), 500);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setSubtitleVisible(true), 600);
      return () => clearTimeout(timeout);
    }
  }, [visibleWords, titleWords.length]);

  const fallbackUI = (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050B12]">
      <img 
        src="/brain-texture.png" 
        className="opacity-40 max-h-[60%] object-contain blur-[1px]" 
        alt="Contai Brain"
      />
    </div>
  );

  return (
    <div className="relative h-[80vh] min-h-[500px] w-full overflow-hidden rounded-[36px] bg-[#050B12] shadow-2xl flex items-center justify-center border border-white/5">
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-10 pointer-events-none text-center">
        
        <div className="font-extrabold text-[1.6rem] leading-[1.1] min-[390px]:text-[1.8rem] sm:text-4xl md:text-5xl lg:text-5xl text-white">
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 overflow-hidden">
            {titleWords.map((word, index) => (
              <span
                key={index}
                className={`inline-block transition-all duration-500`}
                style={{
                  transitionDelay: `${index * 0.12 + (delays[index] || 0)}s`,
                  opacity: index < visibleWords ? 1 : 0,
                  transform: index < visibleWords ? "translateY(0)" : "translateY(20px)",
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 sm:mt-6 max-w-xl">
          <div
            className="inline-block rounded-full bg-black/40 border border-white/10 px-6 py-2.5 backdrop-blur-md text-sm md:text-lg lg:text-lg font-medium text-emerald-50 transition-opacity duration-1000 shadow-[0_10px_40px_rgba(0,0,0,0.5)] leading-relaxed"
            style={{
              transitionDelay: `${titleWords.length * 0.12 + 0.3 + subtitleDelay}s`,
              opacity: subtitleVisible ? 1 : 0,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_30%,#050B12_95%)] pointer-events-none" />

      <React.Suspense fallback={fallbackUI}>
        <Canvas
          flat
          className="absolute inset-0 z-0 h-full w-full opacity-90"
        >
          <Scene />
        </Canvas>
      </React.Suspense>
    </div>
  );
}
