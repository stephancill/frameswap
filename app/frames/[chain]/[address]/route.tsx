import { Button } from "frames.js/next";
import { NextRequest } from "next/server";
import { Heading } from "../../../components/heading";
import { COINGECKO_CACHE_TTL } from "../../../const";
import { APP_URL } from "../../../env";
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
        image: `${APP_URL}/images/${chain}/${address}`,
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
      };
    },
    {
      middleware: [tokenMiddleware({ address, chain })],
    }
  )(req);
};

export const GET = frameHandler;
export const POST = frameHandler;
