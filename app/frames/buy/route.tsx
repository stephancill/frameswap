import { Button } from "frames.js/next";
import { getClient } from "../../client";
import { TokenDetail } from "../../components/token-detail";
import { getSwapTransaction } from "../../uniswap";
import { formatUsdDisplay } from "../../utils";
import { frames, priceMiddleware, tokenMiddleware } from "../frames";

export const POST = frames(
  async (ctx) => {
    if (!ctx.token) {
      return { image: <div>Token not found</div> };
    }

    const client = getClient({ chainIdOrName: ctx.token?.chain });
    const buyAmountUsd = parseFloat(ctx.searchParams.amountUsd);
    const ethInputAmount = (buyAmountUsd / ctx.ethUsd).toString();

    // Construct data with any constant address,
    // the user's address will replace it when we have tx data
    const recipient = "0x8d25687829D6b85d9e0020B8c89e3Ca24dE20a89";

    console.log({
      blockchain: client.chain.id,
      outTokenAddress: ctx.token.address,
      ethInputAmountFormatted: ethInputAmount,
      recipientAddress: recipient,
    });

    const quote = await getSwapTransaction({
      chainId: client.chain.id,
      outTokenAddress: ctx.token.address,
      ethInputAmountFormatted: ethInputAmount,
      recipientAddress: recipient,
    });

    console.log({ quote });

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
          action="tx"
          target={{
            pathname: "/buy-tx",
            query: { address: ctx.token.address, chain: ctx.token.chain },
          }}
        >
          Buy
        </Button>,
      ],
    };
  },
  // TODO: concurrentMiddleware
  { middleware: [tokenMiddleware, priceMiddleware] }
);
