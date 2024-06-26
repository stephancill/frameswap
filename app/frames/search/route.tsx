import { Button } from "frames.js/next";
import { isAddress } from "viem";
import { TokenDetail } from "../../components/token-detail";
import { SEARCH_ADDRESS_OR_ID_STEP } from "../../const";
import { getTokenInfo, searchTokens } from "../../token";
import { formatWarpcastIntentUrl } from "../../utils";
import { frames } from "../frames";
import { Heading } from "../../components/heading";
import { Pill } from "../../components/pill";

export const POST = frames(async (ctx) => {
  if (!ctx.message) {
    throw new Error("No message");
  }

  if (ctx.message.inputText) {
    if (ctx.searchParams.step === SEARCH_ADDRESS_OR_ID_STEP) {
      // We have query or address or ID
      if (!isAddress(ctx.message.inputText)) {
        const searchResults = await searchTokens({
          query: ctx.message.inputText,
        });

        const buttons = searchResults
          .map((token) => (
            <Button
              action="post"
              target={{
                pathname: "/search-confirm",
                query: { tokenId: token.id },
              }}
            >
              {token.name}
            </Button>
          ))
          .slice(0, 4) as any;

        return {
          image: (
            <div tw="flex flex-col">
              <Heading>Search results for "{ctx.message.inputText}"</Heading>
            </div>
          ),
          buttons,
        };
      }

      return {
        image: (
          <div tw="w-max-2/3">
            <Heading>
              <div tw="flex items-center">
                Enter chain name or ID for{" "}
                <Pill tw="px-4 py-2 font-regular">
                  {ctx.message.inputText.slice(0, 6)}...
                  {ctx.message.inputText.slice(-4)}
                </Pill>
              </div>
            </Heading>
          </div>
        ),
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
        addressOrId: ctx.searchParams.address,
        chainIdOrName: ctx.message.inputText.toLowerCase(),
      });

      if (!tokenInfo) {
        return {
          image: <Heading>COULD NOT FIND TOKEN. TRY AGAIN</Heading>,
          textInput: "Enter token address",
          buttons: [
            <Button
              action="post"
              target={{
                pathname: "/search",
                query: { step: SEARCH_ADDRESS_OR_ID_STEP },
              }}
            >
              Search
            </Button>,
          ],
        };
      }

      const castUrl = formatWarpcastIntentUrl({
        chain: ctx.message.inputText,
        address: ctx.searchParams.address,
      });

      return {
        image: (
          <div tw="flex flex-col">
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
    image: <Heading>SOMETHING WENT WRONG. TRY AGAIN</Heading>,
    textInput: "Enter token address",
    buttons: [
      <Button
        action="post"
        target={{
          pathname: "/search",
          query: { step: SEARCH_ADDRESS_OR_ID_STEP },
        }}
      >
        Search
      </Button>,
    ],
  };
});
