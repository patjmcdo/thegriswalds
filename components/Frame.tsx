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

// Aspect ratio of the gold-frame.png asset (588 × 433)
const FRAME_RATIO = 433 / 588;

// Approximate inset of the transparent photo window inside the frame,
// expressed as a percentage of the total frame dimensions.
// Matches the values used in scripts/make-frame.mjs.
const PHOTO_INSET = {
  top:    "13.4%",
  left:   "8.8%",
  right:  "8.7%",
  bottom: "13.6%",
};

const EASE_GRAVITY: Easing = [0.55, 0.055, 0.675, 0.19]; // strong ease-in

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

    // --- Wobble: frame shakes as the nail starts to give out ---
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

    // --- Fall: accelerates off the bottom of the screen ---
    setState("fall");
    await controls.start({
      rotate: [0, 10, -5, 22, -8, 30] as number[],
      x: [0, 12, -10, 24, -6, 30] as number[],
      y: [0, 60, 160, 320, 520, 900] as number[],
      opacity: [1, 1, 1, 1, 0.6, 0] as number[],
      transition: {
        duration: 1.0,
        ease: EASE_GRAVITY,
        times: [0, 0.12, 0.3, 0.55, 0.8, 1],
      },
    });

    // Frame is now invisible; swap it out and reveal upload
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

      {/* Frame wrapper — only rendered until fallen */}
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
          {/* Outer sizing container — proportional to the frame asset */}
          <div
            className="gold-frame-container"
            style={{
              // Max 520px wide on desktop, shrinks on mobile
              width: "min(82vw, 520px)",
              aspectRatio: "588 / 433",
              position: "relative",
            }}
          >
            {/* Family photo — fills the container, visible through the frame's transparent window */}
            <div
              style={{
                position: "absolute",
                top: PHOTO_INSET.top,
                left: PHOTO_INSET.left,
                right: PHOTO_INSET.right,
                bottom: PHOTO_INSET.bottom,
                overflow: "hidden",
              }}
            >
              <Image
                src="/family.png"
                alt="Griswold family photo in a gold frame"
                fill
                style={{ objectFit: "cover", objectPosition: "center top" }}
                priority
                draggable={false}
              />
            </div>

            {/* Gold frame overlay — transparent center window shows photo beneath */}
            <Image
              src="/gold-frame.png"
              alt=""
              aria-hidden="true"
              fill
              style={{ objectFit: "fill", pointerEvents: "none" }}
              draggable={false}
              priority
            />
          </div>

          {/* Brass nameplate below frame */}
          <div className="nameplate mt-3 mx-auto px-5 py-1.5 text-xs sm:text-sm text-amber-950 text-center w-fit rounded-sm">
            The Griswolds
          </div>

          {/* Nail dot — visible only in idle state */}
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

      {/* Click prompt — fades out once clicked */}
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
