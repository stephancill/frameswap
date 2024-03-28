import { Button } from "frames.js/next";
import { getTokenInfo } from "../token";
import { frames } from "./frames";
import { APP_URL } from "../env";

const handleRequest = frames(async (ctx) => {
  const tokenAddress = ctx.searchParams.address;
  const chainNameOrId = ctx.searchParams.chain;

  if (!tokenAddress || !chainNameOrId) {
    return {
      image: (
        <div tw="flex flex-col">
          <div tw="mb-4">Search token to generate a cast</div>
          <div tw="flex flex-col">
            <div>or format the url like: </div>
            {APP_URL}/{"<chain>"}/{"<address>"}
          </div>
        </div>
      ),
      textInput: "Enter a token name or address",
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

  const tokenInfo = await getTokenInfo({
    blockchain: chainNameOrId,
    tokenAddress,
  });

  if (!tokenInfo) {
    return {
      image: <div>Invalid URL: could not find token</div>,
    };
  }

  return {
    image: (
      <div>
        <div>Token Info</div>
        <div className="flex flex-row">
          {tokenInfo.image && (
            <div>
              <img src={tokenInfo.image} />
            </div>
          )}
          <div className="flex flex-col">
            <div>Symbol: {tokenInfo.symbol}</div>
            <div>Name: {tokenInfo.name}</div>
          </div>
        </div>
      </div>
    ),
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
