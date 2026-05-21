import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getBucket, getR2Client } from "@/lib/r2";

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const ALLOWED_PREFIXES = ["image/", "video/", "audio/"];

type Body = {
  submissionId: string;
  filename: string;
  contentType: string;
  size: number;
};

function safeFilename(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (
    !body.submissionId ||
    !/^[\w-]+$/.test(body.submissionId) ||
    !body.filename ||
    !body.contentType ||
    typeof body.size !== "number"
  ) {
    return NextResponse.json({ error: "invalid fields" }, { status: 400 });
  }

  if (body.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }

  if (!ALLOWED_PREFIXES.some((p) => body.contentType.startsWith(p))) {
    return NextResponse.json(
      { error: "unsupported file type" },
      { status: 400 },
    );
  }

  const key = `submissions/${body.submissionId}/${safeFilename(body.filename)}`;

  const client = getR2Client();
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: body.contentType,
    }),
    { expiresIn: 60 * 10 }, // 10 minutes
  );

  return NextResponse.json({ url, key });
}
