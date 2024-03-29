import { Button } from "frames.js/next";
import { getClient } from "../../client";
import { TokenDetail } from "../../components/token-detail";
import { DUMMY_TX_ADDRESS } from "../../const";
import { FEE_PERCENTAGE_POINTS, FEE_RECIPIENT_ADDRESS } from "../../env";
import {
  getAndPersistSwapTransaction,
  getSwapTransaction,
} from "../../uniswap";
import { formatUsdDisplay } from "../../utils";
import { frames, priceMiddleware, tokenMiddleware } from "../frames";

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

    const userId = ctx.message.requesterFid;
    const key = `quote:${userId}:${Date.now()}`;

    const quoteParams: Parameters<typeof getSwapTransaction>[0] = {
      chainId: client.chain.id,
      outTokenAddress: ctx.token.address,
      ethInputAmountFormatted: ethInputAmount,
      // Construct data with any constant address,
      // the user's address will replace it when we have tx data
      recipientAddress: DUMMY_TX_ADDRESS,
      feePercentageInt: FEE_PERCENTAGE_POINTS
        ? parseInt(FEE_PERCENTAGE_POINTS)
        : undefined,
      feeRecipientAddress: FEE_RECIPIENT_ADDRESS,
    };

    // Get quote in the background
    getAndPersistSwapTransaction({ key, quoteParams });

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
          Quote
        </Button>,
      ],
    };
  },
  // TODO: concurrentMiddleware
  { middleware: [tokenMiddleware(), priceMiddleware] }
);
