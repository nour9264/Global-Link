"use client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import React, { useRef, useState, useEffect } from "react";

export const BackgroundBeamsWithCollision = ({
  children,
  className,
  beamCount = 10,
  initialX = 0,
  translateX = 0,
  initialY = "-200px",
  translateY = "1800px",
  rotate = 0,
  duration = 8,
  delay = 0,
  repeatDelay = 0,
}: {
  children?: React.ReactNode;
  className?: string;
  beamCount?: number;
  initialX?: number;
  translateX?: number;
  initialY?: string;
  translateY?: string;
  rotate?: number;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Generate beams distributed across full width using viewport width (vw)
  const beams = Array.from({ length: beamCount }, (_, i) => {
    const vwPosition = (i / beamCount) * 100; // 0vw, 6.67vw, 13.33vw, etc.
    const randomOffset = (Math.random() * (100 / beamCount)) * 0.8; // Random within spacing
    
    return {
      initialX: vwPosition + randomOffset,
      translateX: vwPosition + randomOffset,
      initialY: initialY,
      translateY: translateY,
      rotate: rotate,
      duration: duration + Math.random() * 2,
      repeatDelay: repeatDelay,
      delay: delay + (i * 0.3) / beamCount,
      className: ["h-6", "h-8", "h-10", "h-12", "h-14", "h-20"][Math.floor(Math.random() * 6)],
    };
  });

  return (
    <div
      ref={parentRef}
      className={cn(
        "h-full w-full bg-transparent relative flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {beams.map((beam) => (
        <CollisionMechanism
          key={beam.initialX + "beam-idx"}
          beamOptions={beam}
          containerRef={containerRef}
          parentRef={parentRef}
        />
      ))}

      {children}
      <div
        ref={containerRef}
        className="absolute bottom-0 left-0 right-0 bg-transparent w-full pointer-events-none h-[1px]"
      ></div>
    </div>
  );
};

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement | null>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    beamOptions?: {
      initialX?: number;
      translateX?: number;
      initialY?: number | string;
      translateY?: number | string;
      rotate?: number;
      className?: string;
      duration?: number;
      delay?: number;
      repeatDelay?: number;
    };
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({
    detected: false,
    coordinates: null,
  });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX =
            beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;

          setCollision({
            detected: true,
            coordinates: {
              x: relativeX,
              y: relativeY,
            },
          });
          setCycleCollisionDetected(true);
        }
      }
    };

    const animationInterval = setInterval(checkCollision, 50);

    return () => clearInterval(animationInterval);
  }, [cycleCollisionDetected, containerRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
      }, 2000);

      setTimeout(() => {
        setBeamKey((prevKey) => prevKey + 1);
      }, 2000);
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY || "-200px",
          translateX: typeof beamOptions.initialX === 'number' ? `${beamOptions.initialX}vw` : (beamOptions.initialX || "0vw"),
          rotate: beamOptions.rotate || 0,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || "1800px",
            translateX: typeof beamOptions.translateX === 'number' ? `${beamOptions.translateX}vw` : (beamOptions.translateX || "0vw"),
            rotate: beamOptions.rotate || 0,
          },
        }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          "absolute left-0 top-20 m-auto h-14 w-1 rounded-full",
          // Light mode: cyan-blue colors
          "bg-gradient-to-t from-cyan-600 via-blue-500 to-transparent",
          "shadow-[0_0_25px_rgba(6,182,212,0.9),0_0_50px_rgba(6,182,212,0.5)]",
          // Dark mode: brighter cyan-blue with screen blend mode
          "dark:bg-gradient-to-t dark:from-cyan-400 dark:via-blue-400 dark:to-transparent",
          "dark:shadow-[0_0_35px_rgba(34,211,238,1),0_0_70px_rgba(34,211,238,0.7)]",
          "dark:mix-blend-screen",
          beamOptions.className
        )}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            style={{
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
});

CollisionMechanism.displayName = "CollisionMechanism";

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-3 w-12 rounded-full blur-sm
          bg-gradient-to-r from-transparent via-cyan-500 to-transparent
          shadow-[0_0_25px_rgba(6,182,212,0.9),0_0_50px_rgba(6,182,212,0.5)]
          dark:bg-gradient-to-r dark:from-transparent dark:via-cyan-400 dark:to-transparent
          dark:shadow-[0_0_40px_rgba(34,211,238,1),0_0_80px_rgba(34,211,238,0.7)]
          dark:mix-blend-screen"
      ></motion.div>
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1.5 w-1.5 rounded-full
            bg-gradient-to-b from-cyan-400 via-blue-500 to-sky-400
            shadow-[0_0_10px_rgba(6,182,212,0.9),0_0_20px_rgba(6,182,212,0.6)]
            dark:bg-gradient-to-b dark:from-cyan-300 dark:via-blue-400 dark:to-sky-400
            dark:shadow-[0_0_15px_rgba(34,211,238,1),0_0_30px_rgba(34,211,238,0.8)]
            dark:mix-blend-screen"
        />
      ))}
    </div>
  );
};
