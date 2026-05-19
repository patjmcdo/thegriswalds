"use client";

import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  useReducedMotion,
  type Easing,
} from "framer-motion";
import Image from "next/image";

type FrameState = "idle" | "wobble" | "fall" | "gone";

interface Props {
  onReveal: () => void;
}

const EASE_GRAVITY: Easing = [0.55, 0.055, 0.675, 0.19];

export default function Frame({ onReveal }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<FrameState>("idle");
  const controls = useAnimationControls();
  const hasStarted = useRef(false);

  const handleClick = async () => {
    if (state !== "idle" || hasStarted.current) return;
    hasStarted.current = true;

    if (prefersReducedMotion) {
      setState("gone");
      onReveal();
      return;
    }

    // --- Wobble: nail starts to give ---
    setState("wobble");
    await controls.start({
      rotate: [-2, 5, -6, 4, -3, 0] as number[],
      x: [0, -8, 10, -6, 5, 0] as number[],
      y: [0, -4, 3, -3, 2, 0] as number[],
      transition: {
        duration: 0.65,
        ease: "easeInOut" as Easing,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    });

    // --- Fall: accelerates entirely off the bottom of the screen ---
    setState("fall");
    await controls.start({
      rotate: [0, 10, -5, 22, -8, 30] as number[],
      x: [0, 12, -10, 24, -6, 30] as number[],
      y: [0, 60, 160, 320, 520, 900] as number[],
      opacity: [1, 1, 1, 1, 0.5, 0] as number[],
      transition: {
        duration: 1.0,
        ease: EASE_GRAVITY,
        times: [0, 0.12, 0.3, 0.55, 0.8, 1],
      },
    });

    setState("gone");
    onReveal();
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* "Do not touch" sticky note */}
      <AnimatePresence>
        {state === "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="sticky-note absolute -right-2 top-6 sm:-right-20 sm:top-4 z-10 px-3 py-1.5 text-xs sm:text-sm text-amber-900 select-none pointer-events-none"
            aria-hidden="true"
          >
            Do not touch.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frame — removed from DOM once fallen */}
      {state !== "gone" && (
        <motion.button
          className="frame-button relative cursor-pointer focus:outline-none select-none"
          animate={controls}
          initial={{ rotate: -2 }}
          onClick={handleClick}
          disabled={state !== "idle"}
          aria-label="Click to open the family photo archive"
          tabIndex={0}
          style={{ touchAction: "manipulation" }}
        >
          {/* Outer wooden frame */}
          <div className="frame-outer rounded-sm p-[14px] sm:p-[18px]">
            {/* Brass inner mat border */}
            <div
              className="p-[3px] sm:p-[4px]"
              style={{
                background: "linear-gradient(135deg, #d4aa50, #b8922a, #d4aa50)",
              }}
            >
              {/* Photo */}
              <div
                className="relative overflow-hidden"
                style={{ width: "min(72vw, 480px)", height: "min(48vw, 320px)" }}
              >
                <Image
                  src="/family.png"
                  alt="Griswold family photo in a wooden frame"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                  priority
                  draggable={false}
                />
                {/* Subtle glass glare */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Brass nameplate */}
          <div className="nameplate mt-3 mx-auto px-5 py-1.5 text-xs sm:text-sm text-amber-950 text-center w-fit rounded-sm">
            The Griswolds
          </div>

          {/* Nail dot */}
          {state === "idle" && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
              style={{
                background: "#8a6030",
                boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}
              aria-hidden="true"
            />
          )}
        </motion.button>
      )}

      {/* Click prompt */}
      <AnimatePresence>
        {state === "idle" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="mt-8 text-sm sm:text-base italic select-none pointer-events-none"
            style={{ color: "#a07850", fontFamily: "Georgia, serif" }}
          >
            Click the frame to begin.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
