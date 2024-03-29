import { Button } from "frames.js/next";
import { getClient } from "../../client";
import { TokenDetail } from "../../components/token-detail";
import { DUMMY_TX_ADDRESS } from "../../const";
import {
  APP_URL,
  FEE_PERCENTAGE_POINTS,
  FEE_RECIPIENT_ADDRESS,
} from "../../env";
import {
  getAndPersistSwapTransaction,
  getSwapTransaction,
} from "../../uniswap";
import { formatUsdDisplay } from "../../utils";
import { frames, priceMiddleware, tokenMiddleware } from "../frames";
import { Pill } from "../../components/pill";

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

    console.log(`${APP_URL}/chain-symbols/${client.chain.name}`);

    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex mb-10">
            <div tw="text-white font-bold items-center">
              BUYING{" "}
              <div tw="inline mx-2">
                <Pill>
                  <div tw="px-4 py-2">${formatUsdDisplay(buyAmountUsd)}</div>{" "}
                </Pill>{" "}
              </div>{" "}
              ON
              <div tw="inline ml-2">
                <Pill>
                  <div tw="flex items-center px-4 py-2">
                    <div>{client.chain.name.toUpperCase()}</div>
                    <div>
                      {" "}
                      <img
                        tw="w-10 h-10"
                        src={`${APP_URL}/chain-symbols/${client.chainName}.svg`}
                        alt=""
                      />
                    </div>
                  </div>
                </Pill>
              </div>
            </div>
          </div>
          <div tw="mx-auto">
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
