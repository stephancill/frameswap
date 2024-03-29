import { kv } from "@vercel/kv";
import { Button } from "frames.js/next";
import { parseEther } from "viem";
import {
  formatEtherDisplay,
  formatUsdDisplay,
  getEthUsdPrice,
} from "../../utils";
import { frames } from "../frames";
import { KVQuote } from "../types";
import { FEE_PERCENTAGE_POINTS } from "../../env";

export const POST = frames(async (ctx) => {
  const key = ctx.searchParams.key;

  const value = await kv.get<KVQuote>(key);

  if (!value) {
    return {
      image: <div>Quote not found</div>,
    };
  }

  if (value.loading) {
    return {
      image: <div>Preparing quote...</div>,
      buttons: [
        <Button action="post" target={{ pathname: "/quote", query: { key } }}>
          Refresh
        </Button>,
      ],
    };
  }

  if (value.error || !value.quote) {
    return {
      image: <div>Error: {value.error ?? "Could not load quote"}</div>,
      buttons: [
        // TODO: this should go to the frame url
        <Button action="post" target={{ pathname: "/" }}>
          Back
        </Button>,
      ],
    };
  }

  const ethPrice = await getEthUsdPrice();
  const ethInput = parseFloat(value.params.ethInputAmountFormatted);
  const usdInput = ethInput * ethPrice;

  // Calculate fees
  const gasInUsd = parseFloat(value.quote.estimatedGasUsedUSD.amount);
  const feeFactor = FEE_PERCENTAGE_POINTS
    ? parseInt(FEE_PERCENTAGE_POINTS) / 100
    : 0;
  const feeInUsd = usdInput * feeFactor;
  const totalFees = gasInUsd + feeInUsd;

  const ethInputFormatted = formatEtherDisplay(
    parseEther(value.params.ethInputAmountFormatted)
  );
  const usdInputFormatted = formatUsdDisplay(usdInput);
  const totalFeesUsdFormatted = formatUsdDisplay(gasInUsd);
  const tokenOutputFormatted = formatUsdDisplay(value.quote.quote.amount);

  return {
    image: (
      <div tw="flex flex-col text-white">
        <div tw="mb-5">Quote found</div>
        <div tw="flex flex-col">
          <div>
            Swapping {ethInputFormatted} ETH (${usdInputFormatted})
          </div>
          <div>
            for {tokenOutputFormatted} {value.quote.quote.currency.symbol}
          </div>
          <div tw="mt-5">Fees: ${totalFeesUsdFormatted}</div>
        </div>
      </div>
    ),
    buttons: [
      <Button
        action="tx"
        post_url={{ pathname: "/buy-tx-submitted", query: { key } }}
        target={{ pathname: "/buy-tx", query: { key } }}
      >
        Confirm
      </Button>,
    ],
  };
});
