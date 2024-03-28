import { NextRequest } from "next/server";
import { frames } from "../../frames";
import { Button } from "frames.js/next";
import { getTokenInfo } from "../../../token";
import { TokenDetail } from "../../../components/token-detail";

const frameHandler = async (
  req: NextRequest,
  { params: { address, chain } }: { params: { chain: string; address: string } }
) => {
  return await frames(async (ctx) => {
    console.log({ chain, address });

    // const buttons = [5, 10, 20, 50].map((amount) => (
    //   <Button
    //     action="post"
    //     target={{ pathname: "/buy", query: { chain, address, amount } }}
    //   >
    //     {`Buy $${amount}`}
    //   </Button>
    // ));

    const tokenInfo = await getTokenInfo({
      blockchain: chain,
      tokenAddress: address,
    });

    if (!tokenInfo) {
      return {
        image: <div>Could not find token.</div>,
      };
    }

    return {
      image: (
        <div tw="flex flex-col">
          <TokenDetail tokenInfo={tokenInfo} />
        </div>
      ),
      buttons: [
        <Button
          action="post"
          target={{ pathname: "/buy", query: { chain, address, amountUsd: 5 } }}
        >
          {`Buy $5`}
        </Button>,
        <Button
          action="post"
          target={{
            pathname: "/buy",
            query: { chain, address, amountUsd: 10 },
          }}
        >
          {`Buy $10`}
        </Button>,
      ],
    };
    //   buttons: [
    // [5, 10, 20, 50].map((amount) => (
    //   <Button
    //     action="post"
    //     target={{ pathname: "/buy", query: { chain, address, amount } }}
    //   >
    //     {`Buy $${amount}`}
    //   </Button>
    // )),
    //     // Type checking not supported for dynamic arrays
    //   ] as any,
    // };
  })(req);
};

export const GET = frameHandler;
export const POST = frameHandler;
