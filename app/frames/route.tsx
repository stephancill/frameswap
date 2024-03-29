import { Button } from "frames.js/next";
import { TokenDetail } from "../components/token-detail";
import { APP_URL } from "../env";
import { frames, tokenMiddleware } from "./frames";
import { SEARCH_ADDRESS_OR_ID_STEP } from "../const";

const handleRequest = frames(
  async (ctx) => {
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
        textInput: "Enter token address or name",
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

    if (!ctx.token) {
      return {
        image: <div>Invalid URL: could not find token</div>,
      };
    }

    return {
      image: (
        <div>
          <TokenDetail tokenInfo={ctx.token} />
        </div>
      ),
    };
  },
  {
    middleware: [tokenMiddleware()],
  }
);

export const GET = handleRequest;
export const POST = handleRequest;
