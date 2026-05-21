import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/memories/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return new NextResponse("ADMIN_PASSWORD env var not set", { status: 500 });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const [, password] = decoded.split(":");
    if (password === expected) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Memories Admin"' },
  });
}
