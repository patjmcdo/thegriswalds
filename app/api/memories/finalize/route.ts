import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getBucket, getR2Client } from "@/lib/r2";

type FileRef = {
  kind: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

type Body = {
  submissionId: string;
  name: string | null;
  notes: string | null;
  files: FileRef[];
  submittedAt: string;
};

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
    !Array.isArray(body.files)
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const meta = {
    submissionId: body.submissionId,
    name: body.name,
    notes: body.notes,
    files: body.files,
    submittedAt: body.submittedAt,
  };

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: `submissions/${body.submissionId}/meta.json`,
      Body: JSON.stringify(meta, null, 2),
      ContentType: "application/json",
    }),
  );

  return NextResponse.json({ ok: true });
}
