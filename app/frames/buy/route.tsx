import { Button } from "frames.js/next";
import { getClient } from "../../client";
import { TokenDetail } from "../../components/token-detail";
import { CHAIN_SYMBOLS, DUMMY_TX_ADDRESS } from "../../const";
import {
  APP_URL,
  FEE_PERCENTAGE_POINTS,
  FEE_RECIPIENT_ADDRESS,
  SWAP_ENDPOINT_URL,
} from "../../env";
import {
  getAndPersistSwapTransaction,
  getSwapTransaction,
} from "../../uniswap";
import { formatUsdDisplay } from "../../utils";
import { frames, priceMiddleware, tokenMiddleware } from "../frames";
import { Pill } from "../../components/pill";
import { ChainIcon } from "../../components/chain-icon";
import { Heading } from "../../components/heading";
import { kv } from "@vercel/kv";

export const POST = frames(
  async (ctx) => {
    if (!ctx.message) {
      throw new Error("Message not found");
    }

    if (!ctx.token) {
      return { image: <Heading>TOKEN NOT FOUND</Heading> };
    }

    try {
      if (!ctx.searchParams.amountUsd && !ctx.message.inputText) {
        throw new Error("Amount not found");
      } else if (!ctx.searchParams.amountUsd) {
        const amountUsd = parseFloat(ctx.message.inputText!);
        if (isNaN(amountUsd)) {
          throw new Error("Amount not found");
        }
      }
    } catch (error) {
      return {
        image: (
          <div tw="flex flex-col">
            <Heading tw="mb-10">ENTER A VALID AMOUNT</Heading>
            <div tw="mx-auto">
              <TokenDetail tokenInfo={ctx.token} />
            </div>
          </div>
        ),
        textInput: "Enter amount to buy in USD",
        buttons: [
          <Button
            action="post"
            target={`/${ctx.token.chain}/${ctx.token.address}`}
          >
            ← Back
          </Button>,
          <Button
            action="post"
            target={{
              pathname: "/buy",
              query: { chain: ctx.token.chain, address: ctx.token.address },
            }}
          >
            Buy Custom
          </Button>,
        ],
      };
    }

    const client = getClient({ chainIdOrName: ctx.token?.chain });
    const buyAmountUsd = parseFloat(
      ctx.searchParams.amountUsd || ctx.message.inputText!
    );

    if (buyAmountUsd > 50) {
      return {
        image: (
          <div tw="flex flex-col">
            <Heading tw="mb-10">AMOUNT TOO HIGH ($50 LIMIT)</Heading>
            <div tw="mx-auto">
              <TokenDetail tokenInfo={ctx.token} />
            </div>
          </div>
        ),
        textInput: "Enter amount to buy in USD",
        buttons: [
          <Button
            action="post"
            target={`/${ctx.token.chain}/${ctx.token.address}`}
          >
            ← Back
          </Button>,
          <Button
            action="post"
            target={{
              pathname: "/buy",
              query: { chain: ctx.token.chain, address: ctx.token.address },
            }}
          >
            Buy Custom
          </Button>,
        ],
      };
    }

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

    await kv.set(key, JSON.stringify({ loading: true }));

    // Get quote in the background
    fetch(SWAP_ENDPOINT_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        quoteParams,
        extra: { tokenInfo: ctx.token },
      }),
    }).catch(console.error);

    return {
      image: (
        <div tw="flex flex-col">
          <Heading tw="mb-10">BUY</Heading>
          <div tw="flex mb-10">
            <div tw="text-white items-center">
              <Pill tw="mr-2">
                <div tw="px-4 py-2">${formatUsdDisplay(buyAmountUsd)}</div>{" "}
              </Pill>
              <div tw="mr-3 text-gray-500">OF </div>
              <Pill tw="mr-2">
                <div tw="flex items-center py-2 px-4">
                  {ctx.token?.image && (
                    <div tw="mr-2 w-10 h-10 rounded-full overflow-hidden flex">
                      <img tw="w-10 h-10" src={ctx.token.image} />
                    </div>
                  )}
                  <div>{ctx.token.symbol}</div>
                </div>
              </Pill>
              <div tw="mr-3 text-gray-500">ON</div>
              <Pill>
                <div tw="flex items-center px-4 py-2">
                  <div>{client.chain.name.toUpperCase()}</div>
                  {CHAIN_SYMBOLS.includes(client.chainName) && (
                    <div>
                      <ChainIcon chainName={client.chainName} />
                    </div>
                  )}
                </div>
              </Pill>
            </div>
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
