import { Button } from "frames.js/next";
import { NextRequest } from "next/server";
import { TokenDetail } from "../../../components/token-detail";
import { frames, tokenMiddleware } from "../../frames";

const frameHandler = async (
  req: NextRequest,
  { params: { address, chain } }: { params: { chain: string; address: string } }
) => {
  return await frames(
    async (ctx) => {
      const buttons = [5, 10, 20, 50].map((amountUsd) => (
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
          image: <div>Could not find token.</div>,
        };
      }

      return {
        image: (
          <div tw="flex flex-col">
            <TokenDetail tokenInfo={ctx.token} />
          </div>
        ),
        // Type safety issue
        buttons: buttons as any,
      };
    },
    {
      middleware: [tokenMiddleware({ address, chain })],
    }
  )(req);
};

export const GET = frameHandler;
export const POST = frameHandler;
