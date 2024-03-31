import { NextRequest } from "next/server";
import { deserializeJsx } from "../render-image";
import { jsxToImageResponse, loadFonts } from "./images";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const fonts = await loadFonts();

  const serialized = req.nextUrl.searchParams.get("jsx");

  if (!serialized) {
    throw new Error("No jsx");
  }

  const jsx = deserializeJsx(JSON.parse(serialized!));

  const response = jsxToImageResponse({ jsx, fonts });

  return response;
}
