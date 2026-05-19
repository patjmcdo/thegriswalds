"use client";

import { useState } from "react";
import Frame from "@/components/Frame";
import UploadSection from "@/components/UploadSection";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [revealed, setRevealed] = useState(false);

  return (
    <main
      className="wall-texture vignette relative min-h-screen flex flex-col overflow-x-hidden"
      style={{ minHeight: "100dvh" }}
    >
      <div className="relative z-10 flex flex-col items-center flex-1 px-4">

        {/* Page headline — hidden after reveal */}
        <AnimatePresence>
          {!revealed && (
            <motion.header
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
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
                style={{
                  color: "#5c3d2a",
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                We&apos;re collecting family photos, old memories,
                <br className="hidden sm:block" />
                and anything worth preserving.
              </p>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Compact title shown after reveal */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center pt-6 pb-2"
            >
              <p
                className="text-sm"
                style={{
                  color: "#a07850",
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                The Griswold Family Photo Archive
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          Shared slot: the frame lives here until it falls, then the upload
          section takes its place. Both share the same flow position so there's
          no jump in layout.
        */}
        <div className="w-full flex flex-col items-center">
          {/* Frame is absolutely removed from the DOM once it's gone */}
          {!revealed && (
            <div className="pt-4 pb-6">
              <Frame onReveal={() => setRevealed(true)} />
            </div>
          )}

          {/* Upload section slides in where the frame was */}
          <AnimatePresence>
            {revealed && (
              <div className="w-full max-w-lg">
                <UploadSection />
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Baseboard at bottom */}
      <div
        className="baseboard relative z-10 w-full h-10 sm:h-14 mt-auto"
        aria-hidden="true"
      />
    </main>
  );
}
