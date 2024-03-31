import { NextRequest } from "next/server";
import { getTokenInfo } from "../../../token";
import { getClient } from "../../../client";
import { loadFonts, jsxToImageResponse } from "../../images";
import { Logo } from "../../../components/logo";
import { TokenDetail } from "../../../components/token-detail";
import { deserializeJsx, serializeJsx } from "../../../render-image";
import { Scaffold } from "../../../components/scaffold";
import { COINGECKO_CACHE_TTL } from "../../../const";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  {
    params: { address: tokenAddress, chain: chainIdOrNameRaw },
  }: { params: { chain: string; address: string } }
) {
  if (tokenAddress && chainIdOrNameRaw) {
    const chainIdOrName: string | number = isNaN(parseInt(chainIdOrNameRaw))
      ? chainIdOrNameRaw
      : parseInt(chainIdOrNameRaw);

    const client = getClient({ chainIdOrName });

    const [fonts, token] = await Promise.all([
      loadFonts(),
      getTokenInfo({
        chainIdOrName: client.chainName,
        addressOrId: tokenAddress,
      }),
    ]);

    const image = (
      <div tw="flex flex-col">
        <div tw="mb-10">
          <Logo />
        </div>
        <div tw="mx-auto flex flex-col">
          <TokenDetail tokenInfo={token!} />
        </div>
      </div>
    );

    // Clean up the JSX to ensure it behaves as expected
    const imageJson = JSON.stringify(
      serializeJsx(<Scaffold>{image}</Scaffold>)
    );

    const imageJsx = deserializeJsx(JSON.parse(imageJson));

    const imageResponse = jsxToImageResponse({
      jsx: imageJsx,
      fonts,
    });

    const imageData = await imageResponse.arrayBuffer();

    console.log({
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${COINGECKO_CACHE_TTL}`,
    });

    return new Response(imageData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": `public, max-age=${COINGECKO_CACHE_TTL}`,
      },
    });
  }
}
