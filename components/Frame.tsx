"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls, useReducedMotion, type Easing } from "framer-motion";
import Image from "next/image";

type FrameState = "idle" | "wobble" | "fall" | "broken" | "revealUpload";

interface Props {
  onReveal: () => void;
}

const EASE_GRAVITY: Easing = [0.25, 0.46, 0.45, 0.94];

export default function Frame({ onReveal }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<FrameState>("idle");
  const [showCrack, setShowCrack] = useState(false);
  const controls = useAnimationControls();
  const hasStarted = useRef(false);

  const handleClick = async () => {
    if (state !== "idle" || hasStarted.current) return;
    hasStarted.current = true;

    if (prefersReducedMotion) {
      setState("revealUpload");
      onReveal();
      return;
    }

    // --- Wobble ---
    setState("wobble");
    await controls.start({
      rotate: [-2, 4, -5, 3, -2, 0] as number[],
      x: [0, -6, 8, -5, 4, 0] as number[],
      y: [0, -3, 2, -2, 1, 0] as number[],
      transition: {
        duration: 0.7,
        ease: "easeInOut" as Easing,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    });

    // --- Fall ---
    setState("fall");
    await controls.start({
      rotate: [0, 8, -6, 14, -4, 18] as number[],
      x: [0, 10, -8, 18, -5, 22] as number[],
      y: [0, 40, 100, 180, 260, 320] as number[],
      transition: {
        duration: 0.9,
        ease: EASE_GRAVITY,
        times: [0, 0.15, 0.35, 0.6, 0.8, 1],
      },
    });

    // --- Broken ---
    setState("broken");
    await new Promise((r) => setTimeout(r, 150));
    setShowCrack(true);

    await new Promise((r) => setTimeout(r, 700));
    setState("revealUpload");
    onReveal();
  };

  const isBroken = state === "broken" || state === "revealUpload";

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
            className="sticky-note absolute -right-2 top-8 sm:-right-20 sm:top-6 z-10 px-3 py-2 text-xs sm:text-sm text-amber-900 select-none pointer-events-none"
            aria-hidden="true"
          >
            Do not touch.
          </motion.div>
        )}
      </AnimatePresence>

      {/* The animated frame */}
      <motion.button
        className="frame-button relative cursor-pointer focus:outline-none select-none"
        animate={controls}
        initial={{ rotate: -2 }}
        onClick={handleClick}
        disabled={state !== "idle"}
        aria-label="Click to open the family photo archive"
        tabIndex={0}
      >
        {/* Outer wooden frame */}
        <div className="frame-outer rounded-sm p-[14px] sm:p-[18px]">
          {/* Brass inner mat */}
          <div
            className="p-[3px] sm:p-[4px]"
            style={{
              background: "linear-gradient(135deg, #d4aa50, #b8922a, #d4aa50)",
            }}
          >
            {/* Photo area */}
            <div
              className="relative overflow-hidden"
              style={{ width: "min(72vw, 480px)", height: "min(48vw, 320px)" }}
            >
              <Image
                src="/family.png"
                alt="Griswold family photo in a wooden frame"
                fill
                style={{ objectFit: "cover" }}
                priority
                draggable={false}
              />

              {/* Crack overlay */}
              <AnimatePresence>
                {showCrack && (
                  <motion.div
                    className="crack-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/crack.svg"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full"
                      style={{ objectFit: "cover", opacity: 0.75 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Glass glare — disappears when broken */}
              {!isBroken && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Brass nameplate */}
        <div className="nameplate mt-3 mx-auto px-5 py-1.5 text-xs sm:text-sm text-amber-950 text-center w-fit rounded-sm">
          The Griswolds
        </div>

        {/* Nail dot — visible only when idle */}
        {state === "idle" && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{
              background: "#8a6030",
              boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
            }}
            aria-hidden="true"
          />
        )}
      </motion.button>

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
