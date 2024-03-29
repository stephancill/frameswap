import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { deserializeJsx } from "../render-image";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const [regularFont, boldFont, boldItalicFont] = await Promise.all([
    fetch(new URL("/public/Roboto-Regular.ttf", import.meta.url)).then((res) =>
      res.arrayBuffer()
    ),
    fetch(new URL("/public/Roboto-Bold.ttf", import.meta.url)).then((res) =>
      res.arrayBuffer()
    ),
    fetch(new URL("/public/Roboto-BoldItalic.ttf", import.meta.url)).then(
      (res) => res.arrayBuffer()
    ),
  ]);

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
        data: regularFont,
        weight: 400,
      },
      {
        name: "Roboto",
        data: boldFont,
        weight: 700,
      },
      {
        name: "Roboto",
        data: boldItalicFont,
        weight: 700,
        style: "italic",
      },
    ],
  });
}
