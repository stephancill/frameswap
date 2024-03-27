import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { deserializeJsx } from "../renderImage";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const [regularFont, boldFont] = await Promise.all([
    fetch(new URL("/public/Satoshi-Regular.ttf", import.meta.url)).then((res) =>
      res.arrayBuffer()
    ),
    fetch(new URL("/public/Satoshi-Bold.ttf", import.meta.url)).then((res) =>
      res.arrayBuffer()
    ),
  ]);

  const serialized = req.nextUrl.searchParams.get("jsx");

  if (!serialized) {
    throw new Error("No jsx");
  }

  const jsx = deserializeJsx(JSON.parse(serialized!));

  return new ImageResponse(jsx, {
    width: 1146,
    height: 600,
    fonts: [
      {
        name: "Satoshi",
        data: regularFont,
        weight: 400,
      },
      {
        name: "Satoshi",
        data: boldFont,
        weight: 700,
      },
    ],
  });
}
