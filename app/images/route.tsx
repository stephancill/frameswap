import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { deserializeJsx } from "../render-image";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export const runtime = "nodejs";

const regularFont = fs.readFile(
  path.join(path.resolve(process.cwd(), "public"), "Roboto-Regular.ttf")
);

const boldFont = fs.readFile(
  path.join(path.resolve(process.cwd(), "public"), "Roboto-Bold.ttf")
);

const boldItalicFont = fs.readFile(
  path.join(path.resolve(process.cwd(), "public"), "Roboto-BoldItalic.ttf")
);

export async function GET(req: NextRequest) {
  const [regularFontData, boldFontData, boldItalicFontData] = await Promise.all(
    [regularFont, boldFont, boldItalicFont]
  );

  const serialized = req.nextUrl.searchParams.get("jsx");

  if (!serialized) {
    throw new Error("No jsx");
  }

  const jsx = deserializeJsx(JSON.parse(serialized!));

  const width = 1000;
  const height = Math.round(width * 1.91);

  return new ImageResponse(jsx, {
    width,
    height,
    fonts: [
      {
        name: "Roboto",
        data: regularFontData,
        weight: 400,
      },
      {
        name: "Roboto",
        data: boldFontData,
        weight: 700,
      },
      {
        name: "Roboto",
        data: boldItalicFontData,
        weight: 700,
        style: "italic",
      },
    ],
  });
}
