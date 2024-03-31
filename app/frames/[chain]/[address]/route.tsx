import { Button } from "frames.js/next";
import { NextRequest } from "next/server";
import { Heading } from "../../../components/heading";
import { Logo } from "../../../components/logo";
import { TokenDetail } from "../../../components/token-detail";
import { COINGECKO_CACHE_TTL } from "../../../const";
import { frames, tokenMiddleware } from "../../frames";

const frameHandler = async (
  req: NextRequest,
  { params: { address, chain } }: { params: { chain: string; address: string } }
) => {
  return await frames(
    async (ctx) => {
      const buttons = [5, 10, 20].map((amountUsd) => (
        <Button
          action="post"
          target={{
            pathname: "/buy",
            query: { chain, address, amountUsd },
          }}
        >
          {`Buy $${amountUsd}`}
        </Button>
      ));

      if (!ctx.token) {
        return {
          image: <Heading>COULD NOT FIND TOKEN</Heading>,
        };
      }

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="mb-10">
              <Logo />
            </div>
            <div tw="mx-auto flex flex-col">
              <TokenDetail tokenInfo={ctx.token} />
            </div>
          </div>
        ),
        textInput: "Enter amount to buy in USD",
        buttons: [
          ...buttons,
          <Button
            action="post"
            target={{
              pathname: "/buy",
              query: { chain, address },
            }}
          >
            Buy Custom
          </Button>,
        ] as any,
        headers: {
          "Cache-Control": `max-age=${COINGECKO_CACHE_TTL}`,
        },
      };
    },
    {
      middleware: [tokenMiddleware({ address, chain })],
    }
  )(req);
};

export const GET = frameHandler;
export const POST = frameHandler;
