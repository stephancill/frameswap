import { ImageResponse } from "@vercel/og";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function loadFonts() {
  const regularFont = fs.readFile(
    path.join(path.resolve(process.cwd(), "public"), "Roboto-Regular.ttf")
  );

  const boldFont = fs.readFile(
    path.join(path.resolve(process.cwd(), "public"), "Roboto-Bold.ttf")
  );

  const boldItalicFont = fs.readFile(
    path.join(path.resolve(process.cwd(), "public"), "Roboto-BoldItalic.ttf")
  );

  const [regularFontData, boldFontData, boldItalicFontData] = await Promise.all(
    [regularFont, boldFont, boldItalicFont]
  );

  return {
    regularFontData,
    boldFontData,
    boldItalicFontData,
  };
}

export function jsxToImageResponse({
  jsx,
  fonts: { boldFontData, boldItalicFontData, regularFontData },
}: {
  jsx: JSX.Element;
  fonts: Awaited<ReturnType<typeof loadFonts>>;
}) {
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
