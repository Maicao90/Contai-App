import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref">;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isCompactScreen = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SEPARATION = isCompactScreen ? 140 : 150;
    const AMOUNT_X = isCompactScreen ? 28 : 40;
    const AMOUNT_Y = isCompactScreen ? 40 : 60;
    const sceneColor = theme === "dark" ? 0x050b12 : 0xf7faf9;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(sceneColor, 1800, 9500);

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompactScreen ? 1.2 : 1.5));
    renderer.setClearColor(sceneColor, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const positions: number[] = [];
    const colors: number[] = [];
    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNT_X; ix++) {
      for (let iy = 0; iy < AMOUNT_Y; iy++) {
        const x = ix * SEPARATION - (AMOUNT_X * SEPARATION) / 2;
        const y = 0;
        const z = iy * SEPARATION - (AMOUNT_Y * SEPARATION) / 2;

        positions.push(x, y, z);

        if (theme === "dark") {
          colors.push(0.46, 0.9, 0.77);
        } else {
          colors.push(0.08, 0.22, 0.2);
        }
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 7,
      vertexColors: true,
      transparent: true,
      opacity: theme === "dark" ? 0.5 : 0.3,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const setSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    setSize();

    let count = 0;
    let animationId = 0;
    let lastFrameTime = 0;
    const frameInterval = prefersReducedMotion ? 1000 / 12 : 1000 / 24;

    const animate = (timestamp = 0) => {
      animationId = window.requestAnimationFrame(animate);

      if (document.hidden) {
        return;
      }

      if (timestamp - lastFrameTime < frameInterval) {
        return;
      }
      lastFrameTime = timestamp;

      const positionAttribute = geometry.attributes.position;
      const positionArray = positionAttribute.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNT_X; ix++) {
        for (let iy = 0; iy < AMOUNT_Y; iy++) {
          const index = i * 3;
          positionArray[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50;
          i++;
        }
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      count += prefersReducedMotion ? 0.03 : isCompactScreen ? 0.042 : 0.05;
    };

    const resizeObserver = new ResizeObserver(() => setSize());
    resizeObserver.observe(container);
    window.addEventListener("resize", setSize);
    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", setSize);
      resizeObserver.disconnect();

      scene.remove(points);
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      if (rendererRef.current === renderer) {
        rendererRef.current = null;
      }
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0", className)}
      {...props}
    />
  );
}
