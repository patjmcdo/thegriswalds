"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

async function uploadFile(
  submissionId: string,
  file: File,
): Promise<{ key: string }> {
  const tokenRes = await fetch("/api/memories/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      submissionId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  });
  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => "");
    throw new Error(`Failed to get upload URL: ${tokenRes.status} ${detail}`);
  }
  const { url, key } = (await tokenRes.json()) as {
    url: string;
    key: string;
  };

  const putRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "content-type": file.type || "application/octet-stream" },
  });
  if (!putRes.ok) {
    throw new Error(`Upload failed: ${putRes.status}`);
  }
  return { key };
}

type RecorderState = "idle" | "recording" | "recorded";
type SubmitState = "idle" | "submitting" | "done" | "error";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function pickAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function extForMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "bin";
}

export default function MemoriesForm() {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submit, setSubmit] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setRecorderError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecorderState("recorded");
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecorderState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error(err);
      setRecorderError(
        "We couldn't access your microphone. Please allow microphone access and try again.",
      );
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recorderState === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setSeconds(0);
    setRecorderState("idle");
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const hasContent =
    audioBlob !== null || files.length > 0 || notes.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasContent || submit === "submitting") return;

    setSubmit("submitting");
    setSubmitError(null);

    try {
      const submissionId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const uploaded: Array<{ kind: string; key: string; name: string; size: number; type: string }> = [];

      if (audioBlob) {
        const ext = extForMime(audioBlob.type);
        const audioFile = new File([audioBlob], `voice-memory.${ext}`, {
          type: audioBlob.type,
        });
        const { key } = await uploadFile(submissionId, audioFile);
        uploaded.push({
          kind: "audio",
          key,
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type,
        });
      }

      for (const file of files) {
        const { key } = await uploadFile(submissionId, file);
        uploaded.push({
          kind: file.type.startsWith("video/") ? "video" : "photo",
          key,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }

      const res = await fetch("/api/memories/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId,
          name: name.trim() || null,
          notes: notes.trim() || null,
          files: uploaded,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Finalize failed: ${res.status}`);

      setSubmit("done");
    } catch (err) {
      console.error(err);
      setSubmitError(
        "Something went wrong while submitting. Please try again.",
      );
      setSubmit("error");
    }
  }

  if (submit === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-6 py-14"
      >
        <h2
          className="text-2xl sm:text-3xl font-bold mb-3"
          style={{ color: "#2b1d13", fontFamily: "Georgia, serif" }}
        >
          Thank you.
        </h2>
        <p
          className="text-base sm:text-lg"
          style={{ color: "#5c3d2a", fontFamily: "Georgia, serif" }}
        >
          Your memory has been saved with the family.
        </p>
        <button
          type="button"
          onClick={() => {
            setName("");
            setNotes("");
            setFiles([]);
            resetRecording();
            setSubmit("idle");
          }}
          className="mt-8 text-sm underline"
          style={{ color: "#7a5a3a", fontFamily: "Georgia, serif" }}
        >
          Share another
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-2 py-6 sm:py-10 space-y-8"
      style={{ fontFamily: "Georgia, serif", color: "#2b1d13" }}
    >
      {/* Voice memory */}
      <section>
        <h2
          className="text-lg sm:text-xl font-semibold mb-2"
          style={{ color: "#2b1d13" }}
        >
          Record a voice memory
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "#7a5a3a", fontStyle: "italic" }}
        >
          A story, a memory, a few words — however long you&apos;d like.
        </p>

        <div className="flex flex-col items-center gap-3 py-4">
          {recorderState === "idle" && (
            <button
              type="button"
              onClick={startRecording}
              className="mic-btn flex items-center justify-center w-20 h-20 rounded-full shadow-md"
              aria-label="Start recording"
            >
              <MicIcon />
            </button>
          )}

          {recorderState === "recording" && (
            <>
              <button
                type="button"
                onClick={stopRecording}
                className="stop-btn flex items-center justify-center w-20 h-20 rounded-full shadow-md"
                aria-label="Stop recording"
              >
                <StopIcon />
              </button>
              <div
                className="text-sm flex items-center gap-2"
                style={{ color: "#7a2e2a" }}
              >
                <span className="recording-dot" /> Recording — {formatTime(seconds)}
              </div>
            </>
          )}

          {recorderState === "recorded" && audioUrl && (
            <div className="w-full flex flex-col items-center gap-3">
              <audio src={audioUrl} controls className="w-full" />
              <button
                type="button"
                onClick={resetRecording}
                className="text-sm underline"
                style={{ color: "#7a5a3a" }}
              >
                Re-record
              </button>
            </div>
          )}
        </div>

        {recorderError && (
          <p className="text-sm text-center" style={{ color: "#7a2e2a" }}>
            {recorderError}
          </p>
        )}
      </section>

      <Divider />

      {/* Photo / video upload */}
      <section>
        <h2
          className="text-lg sm:text-xl font-semibold mb-2"
          style={{ color: "#2b1d13" }}
        >
          Add a photo or video
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "#7a5a3a", fontStyle: "italic" }}
        >
          Anything you have of Gloria — old or new.
        </p>

        <label
          className="upload-btn inline-block px-6 py-3 rounded-lg shadow-md cursor-pointer text-base"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Choose files
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onFilesChange}
            className="hidden"
          />
        </label>

        {files.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded"
                style={{ background: "rgba(122, 90, 58, 0.08)" }}
              >
                <span className="truncate" style={{ color: "#2b1d13" }}>
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-xs underline shrink-0"
                  style={{ color: "#7a2e2a" }}
                  aria-label={`Remove ${f.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Divider />

      {/* Notes + name */}
      <section className="space-y-4">
        <h2
          className="text-lg sm:text-xl font-semibold"
          style={{ color: "#2b1d13" }}
        >
          A few words
        </h2>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm mb-1"
            style={{ color: "#5c3d2a" }}
          >
            Notes about the photo or memory (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="memories-input w-full p-3 rounded"
            placeholder="When was this taken, what was happening, what you remember..."
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm mb-1"
            style={{ color: "#5c3d2a" }}
          >
            Your name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="memories-input w-full p-3 rounded"
            placeholder="So we know who shared it"
          />
        </div>
      </section>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!hasContent || submit === "submitting"}
          className="upload-btn w-full py-4 text-lg font-semibold rounded-lg shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {submit === "submitting" ? "Sharing..." : "Share with the family"}
        </button>
        {!hasContent && (
          <p
            className="text-center text-xs mt-3"
            style={{ color: "#a07850", fontStyle: "italic" }}
          >
            Record a voice memory, add a file, or write a few words to share.
          </p>
        )}
        <AnimatePresence>
          {submitError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm mt-3"
              style={{ color: "#7a2e2a" }}
            >
              {submitError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.form>
  );
}

function Divider() {
  return (
    <div className="flex justify-center">
      <div className="w-24 border-t border-amber-800/30" />
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
