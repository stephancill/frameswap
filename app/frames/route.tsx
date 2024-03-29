import { Button } from "frames.js/next";
import { TokenDetail } from "../components/token-detail";
import { APP_URL } from "../env";
import { frames, tokenMiddleware } from "./frames";
import { SEARCH_ADDRESS_OR_ID_STEP } from "../const";
import { Logo } from "../components/logo";
import { Pill } from "../components/pill";

const handleRequest = frames(
  async (ctx) => {
    const tokenAddress = ctx.searchParams.address;
    const chainNameOrId = ctx.searchParams.chain;

    if (!tokenAddress || !chainNameOrId) {
      return {
        image: (
          <div tw="flex flex-col">
            <Logo></Logo>
            <div tw="mb-4">SEARCH TOKEN TO GENERATE A CAST</div>
            <div tw="flex flex-col text-gray-500">
              <div tw="mb-2">or format the url like: </div>
              <Pill>
                <div tw="py-1 px-2">
                  {APP_URL}/{"<chain>"}/{"<address>"}
                </div>
              </Pill>
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
