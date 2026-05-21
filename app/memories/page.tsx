import type { Metadata } from "next";
import MemoriesForm from "@/components/MemoriesForm";

export const metadata: Metadata = {
  title: "In Loving Memory of Gloria",
  description:
    "Share a voice memory, photo, or note about Gloria. Your contribution helps us remember her.",
};

export default function MemoriesPage() {
  return (
    <main
      className="wall-texture vignette relative min-h-screen flex flex-col overflow-x-hidden"
      style={{ minHeight: "100dvh" }}
    >
      <div className="relative z-10 flex flex-col items-center flex-1 px-4 pb-12">
        <header className="text-center pt-10 pb-6 sm:pt-14 sm:pb-8 max-w-xl">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-snug"
            style={{ color: "#2b1d13", fontFamily: "Georgia, serif" }}
          >
            In Loving Memory of
            <br />
            Gloria
          </h1>
          <p
            className="mt-4 text-base sm:text-lg"
            style={{
              color: "#5c3d2a",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Share a memory, a photo, or a few words.
            <br className="hidden sm:block" />
            Anything you&apos;d like the family to keep.
          </p>
        </header>

        <div className="w-full max-w-lg">
          <MemoriesForm />
        </div>
      </div>

      <div
        className="baseboard relative z-10 w-full h-10 sm:h-14 mt-auto"
        aria-hidden="true"
      />
    </main>
  );
}
