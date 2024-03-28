import { Button } from "frames.js/next";
import { frames } from "../frames";
import { getTokenInfo } from "../../token";
import { APP_URL } from "../../env";
import { TokenDetail } from "../../components/token-detail";

export const POST = frames(async (ctx) => {
  if (!ctx.message) {
    throw new Error("No message");
  }

  if (ctx.message.inputText) {
    if (ctx.searchParams.step === "chain") {
      return {
        image: <div>Enter chain name or ID for "{ctx.message.inputText}"</div>,
        textInput: "Chain name or ID",
        buttons: [
          <Button
            action="post"
            target={{
              pathname: "/search",
              query: { address: ctx.message.inputText },
            }}
          >
            Search
          </Button>,
        ],
      };
    } else if (ctx.searchParams.address) {
      // Handle chain name or ID
      const tokenInfo = await getTokenInfo({
        tokenAddress: ctx.searchParams.address,
        blockchain: ctx.message.inputText,
      });

      if (!tokenInfo) {
        return {
          image: <div>Could not find token. Try again</div>,
          textInput: "Enter token address",
          buttons: [
            <Button
              action="post"
              target={{ pathname: "/search", query: { step: "chain" } }}
            >
              Search
            </Button>,
          ],
        };
      }

      const frameUrl = `${APP_URL}/frames/${ctx.message.inputText}/${ctx.searchParams.address}`;
      const castUrl = `https://warpcast.com/~/compose?embeds[]=${encodeURIComponent(
        frameUrl
      )}`;

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
    }
  }

  return {
    image: <div>Something went wrong. Try again</div>,
    textInput: "Enter token address",
    buttons: [
      <Button
        action="post"
        target={{ pathname: "/search", query: { step: "chain" } }}
      >
        Search
      </Button>,
    ],
  };
});
