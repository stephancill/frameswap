import { NextRequest } from "next/server";
import { frames } from "../../../frames";
import { getFrame } from "frames.js";
import { Button } from "frames.js/next";

export const POST = async (
  req: NextRequest,
  { params }: { params: { tx: string } }
) => {
  return frames(async (ctx) => {
    const back = ctx.searchParams.back;

    // Fetch page from onceupon.gg
    const url = `https://onceupon.gg/tx/${params.tx}`;
    const explorerRes = await fetch(url);
    const htmlString = await explorerRes.text();
    const { frame } = getFrame({ htmlString, url });
    return {
      image: frame.image,
      buttons: [
        back ? (
          <Button action="post" target={back}>
            ← Back
          </Button>
        ) : null,
        ...(frame.buttons?.slice(-1)?.map((button) => {
          return <Button {...button}>{button.label}</Button>;
        }) || []),
      ] as any,
    };
  })(req);
};
