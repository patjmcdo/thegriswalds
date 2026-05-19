"use client";

import { motion } from "framer-motion";
import { DROPBOX_FILE_REQUEST_URL } from "@/lib/config";

export default function UploadSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center text-center px-6 py-10 max-w-lg mx-auto"
    >
      {/* Post-animation heading */}
      <h2
        className="text-2xl sm:text-3xl font-bold mb-2"
        style={{ color: "#2b1d13", fontFamily: "Georgia, serif" }}
      >
        Classic Griswold behaviour.
      </h2>

      <p
        className="text-base sm:text-lg mb-8"
        style={{ color: "#5c3d2a", fontFamily: "Georgia, serif" }}
      >
        Now upload your photos before anything else breaks.
      </p>

      {/* Primary CTA */}
      <a
        href={DROPBOX_FILE_REQUEST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="upload-btn inline-block px-10 py-4 text-lg sm:text-xl font-semibold rounded-lg shadow-md"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Upload Photos
      </a>

      {/* Helper text */}
      <p
        className="mt-5 text-sm sm:text-base"
        style={{ color: "#7a5a3a", fontFamily: "Georgia, serif", fontStyle: "italic" }}
      >
        You don&apos;t need a Dropbox account.
        <br />
        Just click, choose your photos, and upload.
      </p>

      {/* Divider */}
      <div className="mt-10 w-24 border-t border-amber-800/30" />

      {/* Upload guide */}
      <div
        className="mt-8 text-left w-full text-sm sm:text-base"
        style={{ color: "#5c3d2a", fontFamily: "Georgia, serif" }}
      >
        <p className="font-semibold mb-3" style={{ color: "#2b1d13" }}>
          What to upload:
        </p>
        <ul className="space-y-1.5 list-none">
          {[
            "Old family photos",
            "Photos from your phone",
            "Scanned albums",
            "Group shots and candid moments",
            "Anything meaningful, funny, or worth preserving",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span style={{ color: "#c9a84c" }} aria-hidden="true">
                —
              </span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-5 font-semibold" style={{ color: "#2b1d13" }}>
          Tips:
        </p>
        <ul className="mt-2 space-y-1.5 list-none">
          {[
            "Upload the highest quality version you have.",
            "Multiple uploads are fine.",
            "Don\u2019t worry about organizing everything perfectly.",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span style={{ color: "#c9a84c" }} aria-hidden="true">
                —
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Joke footer copy */}
      <p
        className="mt-10 text-xs"
        style={{ color: "#a07850", fontFamily: "Georgia, serif", fontStyle: "italic" }}
      >
        Family archive may contain sideburns, perms, and suspicious Christmas sweaters.
      </p>
    </motion.div>
  );
}
