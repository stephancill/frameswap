import { Button } from "frames.js/next";
import { TokenDetail } from "../../components/token-detail";
import { getTokenInfo } from "../../token";
import { formatWarpcastIntentUrl } from "../../utils";
import { frames } from "../frames";

export const POST = frames(async (ctx) => {
  const { tokenId } = ctx.searchParams;

  if (!tokenId) {
    throw new Error("No tokenId");
  }

  const tokenInfo = await getTokenInfo({ addressOrId: tokenId });

  if (!tokenInfo) {
    throw new Error("Could not find token");
  }

  const castUrl = formatWarpcastIntentUrl({
    chain: tokenInfo.chainId,
    address: tokenInfo.address,
  });

  return {
    image: (
      <div tw="flex flex-col">
        <div tw="mb-2">Token Info</div>
        <TokenDetail tokenInfo={tokenInfo} />
      </div>
    ),
    buttons: [
      <Button action="link" target={castUrl}>
        Create cast
      </Button>,
    ],
  };
});
