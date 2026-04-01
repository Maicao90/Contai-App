"use client";

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useAspect, useTexture } from "@react-three/drei";
import React, { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three/webgpu";
// @ts-ignore
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { Mesh } from "three";

import {
  abs,
  blendScreen,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  pass,
  mix,
  add,
// @ts-ignore
} from "three/tsl";

// Error Boundary para suportar fallback caso o WebGPU/WebGL crashe em dispositivos fracos
class WebGPUBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    console.error("WebGPU/ThreeJS crashou:", error);
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // Log do erro silenciado para não travar a aplicação React
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const TEXTUREMAP = { src: "/brain-texture.png" };
const DEPTHMAP = { src: "/brain-depth.webp" };

extend(THREE as any);

const PostProcessing = ({
  strength = 0.8,
  threshold = 1,
  fullScreenEffect = true,
}: {
  strength?: number;
  threshold?: number;
  fullScreenEffect?: boolean;
}) => {
  const { gl, scene, camera } = useThree();
  const progressRef = useRef({ value: 0 });

  const render = useMemo(() => {
    const postProcessing = new THREE.PostProcessing(gl as any);
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode("output");
    const bloomPass = bloom(scenePassColor, strength, 0.5, threshold);

    const uScanProgress = uniform(0);
    progressRef.current = uScanProgress;

    const scanPos = float(uScanProgress.value);
    const uvY = uv().y;
    const scanWidth = float(0.05);
    const scanLine = smoothstep(0, scanWidth, abs(uvY.sub(scanPos)));
    
    // Mudado para Esmeralda do Contai (#10b981) via shader vec3:
    const emeraldOverlay = vec3(0.06, 0.72, 0.50).mul(oneMinus(scanLine)).mul(0.4);

    const withScanEffect = mix(
      scenePassColor,
      add(scenePassColor, emeraldOverlay),
      fullScreenEffect ? smoothstep(0.9, 1.0, oneMinus(scanLine)) : 1.0
    );

    const final = withScanEffect.add(bloomPass);
    postProcessing.outputNode = final;

    return postProcessing;
  }, [camera, gl, scene, strength, threshold, fullScreenEffect]);

  useFrame(({ clock }) => {
    progressRef.current.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
    render.renderAsync();
  }, 1);

  return null;
};

const WIDTH = 300;
const HEIGHT = 300;

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);
  const meshRef = useRef<Mesh>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (rawMap && depthMap) {
      setVisible(true);
    }
  }, [rawMap, depthMap]);

  const { material, uniforms } = useMemo(() => {
    const uPointer = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);
    const strength = 0.01;
    const tDepthMap = texture(depthMap);

    const tMap = texture(rawMap, uv().add(tDepthMap.r.mul(uPointer).mul(strength)));

    const aspect = float(WIDTH).div(HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(120.0);
    const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUv.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const depth = tDepthMap;
    const flow = oneMinus(smoothstep(0, 0.02, abs(depth.r.sub(uProgress))));
    
    // Cor esmeralda no shader do glitch de profundidade
    const mask = dot.mul(flow).mul(vec3(0, 10, 6)); 

    const final = blendScreen(tMap, mask);

    const material = new THREE.MeshBasicNodeMaterial({
      colorNode: final,
      transparent: true,
      opacity: 0,
    });

    return {
      material,
      uniforms: {
        uPointer,
        uProgress,
      },
    };
  }, [rawMap, depthMap]);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock }) => {
    uniforms.uProgress.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
    if (meshRef.current && "material" in meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as any;
      if ("opacity" in mat) {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, visible ? 1 : 0, 0.07);
      }
    }
  });

  useFrame(({ pointer }) => {
    uniforms.uPointer.value = pointer;
  });

  const { size } = useThree();
  const isMobile = size.width < 768;
  const scaleFactor = isMobile ? 0.55 : 0.35;
  
  return (
    <mesh ref={meshRef} scale={[w * scaleFactor, h * scaleFactor, 1]} material={material}>
      <planeGeometry />
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
      const timeout = setTimeout(() => setVisibleWords(visibleWords + 1), 600);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setSubtitleVisible(true), 800);
      return () => clearTimeout(timeout);
    }
  }, [visibleWords, titleWords.length]);

  const fallbackUI = (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050B12]">
      <div 
        className="opacity-40 bg-[url('/brain-texture.png')] bg-contain bg-center bg-no-repeat absolute inset-0 blur-[2px] mix-blend-screen" 
        aria-hidden="true"
      />
      <div className="z-10 text-emerald-500/20 text-xs uppercase tracking-widest font-mono">
        Optimizing Experience...
      </div>
    </div>
  );

  return (
    <div className="relative h-[80vh] min-h-[500px] w-full overflow-hidden rounded-[36px] bg-[#050B12] shadow-2xl flex items-center justify-center border border-white/5">
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-10 pointer-events-none">
        
        <div className="text-center font-extrabold text-[1.6rem] leading-[1.1] min-[390px]:text-[1.8rem] sm:text-4xl md:text-5xl lg:text-5xl text-white">
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 overflow-hidden mix-blend-difference">
            {titleWords.map((word, index) => (
              <span
                key={index}
                className={`inline-block transition-opacity duration-500`}
                style={{
                  transitionDelay: `${index * 0.13 + (delays[index] || 0)}s`,
                  opacity: index < visibleWords ? 1 : 0,
                  transform: index < visibleWords ? "translateY(0)" : "translateY(10px)",
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 sm:mt-6 text-center max-w-xl">
          <div
            className="inline-block rounded-full bg-black/30 border border-white/10 px-6 py-2.5 backdrop-blur-md text-sm md:text-lg lg:text-lg font-medium text-emerald-50 transition-opacity duration-1000 shadow-[0_10px_40px_rgba(0,0,0,0.5)] leading-relaxed"
            style={{
              transitionDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`,
              opacity: subtitleVisible ? 1 : 0,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_30%,#050B12_90%)] pointer-events-none" />

      <WebGPUBoundary fallback={fallbackUI}>
        <Canvas
          flat
          gl={async (props) => {
            const renderer = new THREE.WebGPURenderer(props as any);
            await renderer.init();
            return renderer;
          }}
          className="absolute inset-0 z-0 h-full w-full opacity-80 mix-blend-screen"
        >
          <PostProcessing fullScreenEffect={true} strength={0.8} />
          <Scene />
        </Canvas>
      </WebGPUBoundary>
    </div>
  );
}
