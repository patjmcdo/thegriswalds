import {
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getBucket, getR2Client } from "@/lib/r2";

export const dynamic = "force-dynamic";

type FileRef = {
  kind: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

type Submission = {
  submissionId: string;
  name: string | null;
  notes: string | null;
  files: FileRef[];
  submittedAt: string;
};

type SubmissionWithUrls = Omit<Submission, "files"> & {
  files: (FileRef & { url: string })[];
};

async function streamToString(
  stream: NodeJS.ReadableStream | ReadableStream | undefined,
): Promise<string> {
  if (!stream) return "";
  // Node stream
  if (typeof (stream as NodeJS.ReadableStream).on === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of stream as NodeJS.ReadableStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
  }
  // Web stream
  const reader = (stream as ReadableStream<Uint8Array>).getReader();
  const parts: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const r = await reader.read();
    if (r.value) parts.push(r.value);
    done = r.done;
  }
  return new TextDecoder().decode(
    parts.reduce(
      (acc, cur) => {
        const merged = new Uint8Array(acc.length + cur.length);
        merged.set(acc, 0);
        merged.set(cur, acc.length);
        return merged;
      },
      new Uint8Array(),
    ),
  );
}

async function loadSubmissions(): Promise<SubmissionWithUrls[]> {
  const client = getR2Client();
  const bucket = getBucket();

  const metaKeys: string[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const res: {
      Contents?: Array<{ Key?: string }>;
      IsTruncated?: boolean;
      NextContinuationToken?: string;
    } = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: "submissions/",
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key?.endsWith("/meta.json")) metaKeys.push(obj.Key);
    }
    continuationToken = res.IsTruncated
      ? res.NextContinuationToken
      : undefined;
  } while (continuationToken);

  const submissions = await Promise.all(
    metaKeys.map(async (key) => {
      try {
        const obj = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        const text = await streamToString(
          obj.Body as NodeJS.ReadableStream | ReadableStream | undefined,
        );
        const meta = JSON.parse(text) as Submission;

        const filesWithUrls = await Promise.all(
          meta.files.map(async (f) => ({
            ...f,
            url: await getSignedUrl(
              client,
              new GetObjectCommand({ Bucket: bucket, Key: f.key }),
              { expiresIn: 60 * 60 }, // 1 hour
            ),
          })),
        );
        return { ...meta, files: filesWithUrls };
      } catch {
        return null;
      }
    }),
  );

  return submissions
    .filter((s): s is SubmissionWithUrls => s !== null)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminPage() {
  const submissions = await loadSubmissions();

  return (
    <main
      className="wall-texture vignette min-h-screen px-4 py-10"
      style={{ minHeight: "100dvh", fontFamily: "Georgia, serif" }}
    >
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "#2b1d13" }}
          >
            Memories of Gloria
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#7a5a3a" }}>
            {submissions.length} submission
            {submissions.length === 1 ? "" : "s"}
          </p>
        </header>

        {submissions.length === 0 && (
          <p style={{ color: "#5c3d2a" }}>No submissions yet.</p>
        )}

        <ul className="space-y-6">
          {submissions.map((s) => (
            <li
              key={s.submissionId}
              className="rounded-lg p-5 shadow"
              style={{
                background: "rgba(255, 250, 240, 0.85)",
                border: "1px solid rgba(122, 90, 58, 0.25)",
              }}
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: "#2b1d13" }}
                  >
                    {s.name || "Anonymous"}
                  </p>
                  <p className="text-xs" style={{ color: "#7a5a3a" }}>
                    {new Date(s.submittedAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs" style={{ color: "#a07850" }}>
                  ID: {s.submissionId}
                </p>
              </div>

              {s.notes && (
                <p
                  className="mt-3 whitespace-pre-wrap text-sm"
                  style={{ color: "#2b1d13" }}
                >
                  {s.notes}
                </p>
              )}

              {s.files.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {s.files.map((f) => (
                    <li key={f.key}>
                      {f.kind === "audio" && (
                        <audio src={f.url} controls className="w-full" />
                      )}
                      {f.kind === "photo" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.url}
                          alt={f.name}
                          className="max-w-full rounded"
                        />
                      )}
                      {f.kind === "video" && (
                        <video
                          src={f.url}
                          controls
                          className="max-w-full rounded"
                        />
                      )}
                      <div
                        className="mt-1 text-xs flex items-center gap-3"
                        style={{ color: "#7a5a3a" }}
                      >
                        <a href={f.url} download={f.name} className="underline">
                          {f.name}
                        </a>
                        <span>{formatBytes(f.size)}</span>
                        <span>{f.kind}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
