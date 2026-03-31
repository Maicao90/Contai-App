import { useState, useEffect, useRef } from "react";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
  mouseX: number;
  mouseY: number;
}

const Pupil = ({
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
  mouseX,
  mouseY,
}: PupilProps) => {
  const pupilRef = useRef<HTMLDivElement>(null);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
  mouseX: number;
  mouseY: number;
}

const EyeBall = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
  mouseX,
  mouseY,
}: EyeBallProps) => {
  const eyeRef = useRef<HTMLDivElement>(null);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="flex items-center justify-center rounded-full transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

export interface AnimatedCharactersGroupProps {
  isTyping: boolean;
  passwordLength: number;
  showPassword: boolean;
}

export function AnimatedCharactersGroup({
  isTyping,
  passwordLength,
  showPassword,
}: AnimatedCharactersGroupProps) {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPrimaryBlinking, setIsPrimaryBlinking] = useState(false);
  const [isDarkBlinking, setIsDarkBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPrimaryPeeking, setIsPrimaryPeeking] = useState(false);

  const primaryRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const cyanRef = useRef<HTMLDivElement>(null);
  const tealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(
        () => {
          setIsPrimaryBlinking(true);
          setTimeout(() => {
            setIsPrimaryBlinking(false);
            scheduleBlink();
          }, 150);
        },
        Math.random() * 4000 + 3000,
      );
      return blinkTimeout;
    };
    const t = scheduleBlink();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(
        () => {
          setIsDarkBlinking(true);
          setTimeout(() => {
            setIsDarkBlinking(false);
            scheduleBlink();
          }, 150);
        },
        Math.random() * 4000 + 3000,
      );
      return blinkTimeout;
    };
    const t = scheduleBlink();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
      return undefined;
    }
  }, [isTyping]);

  useEffect(() => {
    if (passwordLength > 0 && showPassword) {
      const schedulePeek = () => {
        const t = setTimeout(
          () => {
            setIsPrimaryPeeking(true);
            setTimeout(() => {
              setIsPrimaryPeeking(false);
            }, 800);
          },
          Math.random() * 3000 + 2000,
        );
        return t;
      };
      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPrimaryPeeking(false);
      return undefined;
    }
  }, [passwordLength, showPassword]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const primaryPos = calculatePosition(primaryRef);
  const darkPos = calculatePosition(darkRef);
  const cyanPos = calculatePosition(cyanRef);
  const tealPos = calculatePosition(tealRef);

  // Mapeamento de cores baseado na identidade do Contai
  // Antigo Roxo -> Verde Esmeralda (#10b981)
  // Antigo Preto -> Grafite Esverdeado (#0f172a / #031310 ou parecido, vamos de #0f1618 escuro)
  // Antigo Laranja -> Ciano (#06b6d4)
  // Antigo Amarelo -> Teal (#14b8a6)

  return (
    <div className="relative h-[400px] w-[550px] scale-75 origin-bottom md:scale-90 lg:scale-100">
      {/* Primary tall rectangle character (Emerald) - Back layer */}
      <div
        ref={primaryRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: "70px",
          width: "180px",
          height: isTyping || (passwordLength > 0 && !showPassword) ? "440px" : "400px",
          backgroundColor: "#10b981", // emerald-500
          borderRadius: "10px 10px 0 0",
          zIndex: 1,
          transform:
            passwordLength > 0 && showPassword
              ? `skewX(0deg)`
              : isTyping || (passwordLength > 0 && !showPassword)
                ? `skewX(${(primaryPos.bodySkew || 0) - 12}deg) translateX(40px)`
                : `skewX(${primaryPos.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: passwordLength > 0 && showPassword ? "20px" : isLookingAtEachOther ? "55px" : `${45 + primaryPos.faceX}px`,
            top: passwordLength > 0 && showPassword ? "35px" : isLookingAtEachOther ? "65px" : `${40 + primaryPos.faceY}px`,
          }}
        >
          <EyeBall
            mouseX={mouseX}
            mouseY={mouseY}
            size={18}
            pupilSize={7}
            maxDistance={5}
            eyeColor="white"
            pupilColor="#022c22"
            isBlinking={isPrimaryBlinking}
            forceLookX={passwordLength > 0 && showPassword ? (isPrimaryPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? (isPrimaryPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
          <EyeBall
            mouseX={mouseX}
            mouseY={mouseY}
            size={18}
            pupilSize={7}
            maxDistance={5}
            eyeColor="white"
            pupilColor="#022c22"
            isBlinking={isPrimaryBlinking}
            forceLookX={passwordLength > 0 && showPassword ? (isPrimaryPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? (isPrimaryPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
        </div>
      </div>

      {/* Dark tall rectangle character (Graphite/Dark Slate) - Middle layer */}
      <div
        ref={darkRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: "240px",
          width: "120px",
          height: "310px",
          backgroundColor: "#0d1b1a", // Tom escuro esverdeado
          border: "2px solid rgba(255,255,255,0.05)",
          borderBottom: "none",
          borderRadius: "8px 8px 0 0",
          zIndex: 2,
          transform:
            passwordLength > 0 && showPassword
              ? `skewX(0deg)`
              : isLookingAtEachOther
                ? `skewX(${(darkPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                : isTyping || (passwordLength > 0 && !showPassword)
                  ? `skewX(${(darkPos.bodySkew || 0) * 1.5}deg)`
                  : `skewX(${darkPos.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: passwordLength > 0 && showPassword ? "10px" : isLookingAtEachOther ? "32px" : `${26 + darkPos.faceX}px`,
            top: passwordLength > 0 && showPassword ? "28px" : isLookingAtEachOther ? "12px" : `${32 + darkPos.faceY}px`,
          }}
        >
          <EyeBall
            mouseX={mouseX}
            mouseY={mouseY}
            size={16}
            pupilSize={6}
            maxDistance={4}
            eyeColor="white"
            pupilColor="#0d1b1a"
            isBlinking={isDarkBlinking}
            forceLookX={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            mouseX={mouseX}
            mouseY={mouseY}
            size={16}
            pupilSize={6}
            maxDistance={4}
            eyeColor="white"
            pupilColor="#0d1b1a"
            isBlinking={isDarkBlinking}
            forceLookX={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      {/* Cyan semi-circle character - Front left */}
      <div
        ref={cyanRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: "0px",
          width: "240px",
          height: "200px",
          zIndex: 3,
          backgroundColor: "#0891b2", // cyan-600
          borderRadius: "120px 120px 0 0",
          transform: passwordLength > 0 && showPassword ? `skewX(0deg)` : `skewX(${cyanPos.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: passwordLength > 0 && showPassword ? "50px" : `${82 + (cyanPos.faceX || 0)}px`,
            top: passwordLength > 0 && showPassword ? "85px" : `${90 + (cyanPos.faceY || 0)}px`,
          }}
        >
          <Pupil mouseX={mouseX} mouseY={mouseY} size={12} maxDistance={5} pupilColor="#083344" forceLookX={passwordLength > 0 && showPassword ? -5 : undefined} forceLookY={passwordLength > 0 && showPassword ? -4 : undefined} />
          <Pupil mouseX={mouseX} mouseY={mouseY} size={12} maxDistance={5} pupilColor="#083344" forceLookX={passwordLength > 0 && showPassword ? -5 : undefined} forceLookY={passwordLength > 0 && showPassword ? -4 : undefined} />
        </div>
      </div>

      {/* Teal tall rectangle character - Front right */}
      <div
        ref={tealRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: "310px",
          width: "140px",
          height: "230px",
          backgroundColor: "#14b8a6", // teal-500
          borderRadius: "70px 70px 0 0",
          zIndex: 4,
          transform: passwordLength > 0 && showPassword ? `skewX(0deg)` : `skewX(${tealPos.bodySkew || 0}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: passwordLength > 0 && showPassword ? "20px" : `${52 + (tealPos.faceX || 0)}px`,
            top: passwordLength > 0 && showPassword ? "35px" : `${40 + (tealPos.faceY || 0)}px`,
          }}
        >
          <Pupil mouseX={mouseX} mouseY={mouseY} size={12} maxDistance={5} pupilColor="#042f2e" forceLookX={passwordLength > 0 && showPassword ? -5 : undefined} forceLookY={passwordLength > 0 && showPassword ? -4 : undefined} />
          <Pupil mouseX={mouseX} mouseY={mouseY} size={12} maxDistance={5} pupilColor="#042f2e" forceLookX={passwordLength > 0 && showPassword ? -5 : undefined} forceLookY={passwordLength > 0 && showPassword ? -4 : undefined} />
        </div>
        <div
          className="absolute h-[4px] w-20 rounded-full bg-[#042f2e] transition-all duration-200 ease-out"
          style={{
            left: passwordLength > 0 && showPassword ? "10px" : `${40 + (tealPos.faceX || 0)}px`,
            top: passwordLength > 0 && showPassword ? "88px" : `${88 + (tealPos.faceY || 0)}px`,
          }}
        />
      </div>
    </div>
  );
}
