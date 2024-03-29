import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Redirect to /frames/...
  const url = new URL(req.url);
  url.pathname = `/frames${url.pathname}`;

  return Response.redirect(url.toString(), 301);
}
