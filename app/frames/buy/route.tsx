import { Button } from "frames.js/next";
import { getClient } from "../../client";
import { TokenDetail } from "../../components/token-detail";
import { getSwapTransaction } from "../../uniswap";
import { formatUsdDisplay } from "../../utils";
import { frames, priceMiddleware, tokenMiddleware } from "../frames";
import { kv } from "@vercel/kv";
import { DUMMY_TX_ADDRESS } from "../../const";
import { FACTORY_ADDRESS_MAP } from "@uniswap/v2-sdk";

export const POST = frames(
  async (ctx) => {
    if (!ctx.message) {
      throw new Error("Message not found");
    }

    if (!ctx.token) {
      return { image: <div>Token not found</div> };
    }

    const client = getClient({ chainIdOrName: ctx.token?.chain });
    const buyAmountUsd = parseFloat(ctx.searchParams.amountUsd);
    const ethInputAmount = (buyAmountUsd / ctx.ethUsd).toString();

    // Construct data with any constant address,
    // the user's address will replace it when we have tx data
    const recipient = DUMMY_TX_ADDRESS;

    const userId = ctx.message.requesterFid;
    const key = `quote:${userId}:${Date.now()}`;

    await kv.set(key, JSON.stringify({ loading: true }));

    const quoteParams: {
      chainId: number;
      outTokenAddress: string;
      ethInputAmountFormatted: string;
      recipientAddress: string;
    } = {
      chainId: client.chain.id,
      outTokenAddress: ctx.token.address,
      ethInputAmountFormatted: ethInputAmount,
      recipientAddress: recipient,
    };

    // Get quote in the background
    getSwapTransaction(quoteParams)
      .then((quote) => {
        // Set value in kv
        const value = JSON.stringify({
          quote: {
            methodParameters: quote?.methodParameters,
          },
          params: quoteParams,
        });
        kv.set(key, value);
      })
      .catch((e) => {
        console.error(e);
        kv.set(key, JSON.stringify({ error: e.message }));
      });

    return {
      image: (
        <div tw="flex flex-col">
          <div>
            Buying ${formatUsdDisplay(buyAmountUsd)} on {client.chain.name}
          </div>
          <div>
            <TokenDetail tokenInfo={ctx.token} />
          </div>
        </div>
      ),
      buttons: [
        <Button
          action="post"
          target={{
            pathname: "/quote",
            query: { key },
          }}
        >
          Get quote
        </Button>,
      ],
    };
  },
  // TODO: concurrentMiddleware
  { middleware: [tokenMiddleware, priceMiddleware] }
);
