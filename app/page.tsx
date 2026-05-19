"use client";

import { useState } from "react";
import Frame from "@/components/Frame";
import UploadSection from "@/components/UploadSection";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [revealed, setRevealed] = useState(false);

  return (
    <main
      className="wall-texture vignette relative min-h-screen flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
      {/* Page content — centered column */}
      <div className="relative z-10 flex flex-col items-center flex-1 px-4 pb-0">
        {/* Header */}
        <AnimatePresence>
          {!revealed && (
            <motion.header
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6 }}
              className="text-center pt-10 pb-6 sm:pt-14 sm:pb-8"
            >
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold leading-snug"
                style={{ color: "#2b1d13", fontFamily: "Georgia, serif" }}
              >
                The Griswold Family
                <br />
                Photo Archive
              </h1>
              <p
                className="mt-3 text-base sm:text-lg max-w-sm mx-auto"
                style={{ color: "#5c3d2a", fontFamily: "Georgia, serif", fontStyle: "italic" }}
              >
                We&apos;re collecting family photos, old memories,
                <br className="hidden sm:block" />
                and anything worth preserving.
              </p>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Post-reveal compact header */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center pt-6 pb-2"
            >
              <p
                className="text-sm"
                style={{ color: "#a07850", fontFamily: "Georgia, serif", fontStyle: "italic" }}
              >
                The Griswold Family Photo Archive
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Frame — always visible, just settles down after animation */}
        <div
          className="relative"
          style={{
            marginTop: revealed ? "0" : "0",
            paddingBottom: revealed ? "340px" : "20px",
            transition: "padding-bottom 0.3s ease",
          }}
        >
          <Frame onReveal={() => setRevealed(true)} />
        </div>

        {/* Upload section — appears after frame falls */}
        <AnimatePresence>
          {revealed && (
            <div className="w-full max-w-lg">
              <UploadSection />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Baseboard at bottom of page */}
      <div className="baseboard relative z-10 w-full h-10 sm:h-14 mt-auto" aria-hidden="true" />
    </main>
  );
}
