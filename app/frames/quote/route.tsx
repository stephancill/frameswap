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
import { APP_URL, FEE_PERCENTAGE_POINTS } from "../../env";
import { Pill } from "../../components/pill";
import { ChainIcon } from "../../components/chain-icon";
import { Heading } from "../../components/heading";

export const POST = frames(async (ctx) => {
  const key = ctx.searchParams.key;

  const value = await kv.get<KVQuote>(key);

  if (!value) {
    return {
      image: <Heading>QUOTE NOT FOUND</Heading>,
    };
  }

  if (value.loading) {
    return {
      image: <Heading>FETCHING QUOTE</Heading>,
      buttons: [
        <Button
          action="post"
          target={{ pathname: "/quote", query: { key, time: Date.now() } }}
        >
          ⟲ Refresh
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

  const quoteRate = usdInput / parseFloat(value.quote.quote.amount);

  const ethInputFormatted = formatEtherDisplay(
    parseEther(value.params.ethInputAmountFormatted)
  );
  const usdInputFormatted = formatUsdDisplay(usdInput);
  const totalFeesUsdFormatted = formatUsdDisplay(gasInUsd);
  const quoteRateFormatted = formatEtherDisplay(
    BigInt(Math.floor(quoteRate * 1e18))
  );
  const tokenOutputFormatted = formatUsdDisplay(value.quote.quote.amount);

  return {
    image: (
      <div tw="flex flex-col">
        <Heading tw="mb-10">QUOTE</Heading>
        <div tw="flex flex-row items-center">
          <Pill tw="inline">
            <div tw="flex items-center pl-4 pr-2 py-2">
              <div>{ethInputFormatted}</div>{" "}
              <div>
                <ChainIcon chainName="ethereum" tw="w-10 h-10" />
              </div>
              <div tw="text-gray-500">${usdInputFormatted}</div>
            </div>
          </Pill>
          <div tw="mx-4">FOR</div>
          <Pill tw="inline">
            <div tw="flex items-center pl-4 pr-2 py-2">
              <div tw="mr-2">{tokenOutputFormatted}</div>{" "}
              {value.tokenInfo?.image && (
                <div tw="mr-2 w-10 h-10 rounded-full overflow-hidden flex">
                  <img tw="w-10 h-10" src={value.tokenInfo.image} />
                </div>
              )}
              <div tw="mr-2">{value.quote.quote.currency.symbol}</div>
              <div tw="text-gray-500">@ ${quoteRateFormatted}</div>
            </div>
          </Pill>
        </div>
        <div tw="flex items-center mt-2">
          <div tw="mr-2">+</div>
          <Pill tw="">
            <div tw="pl-4 pr-2 py-2 items-center flex">
              <img src={`${APP_URL}/gas.svg`} tw="h-8 w-8 mr-2" />
              <div tw="text-gray-500">${totalFeesUsdFormatted} fees</div>
            </div>
          </Pill>
        </div>
      </div>
    ),
    buttons: [
      <Button
        action="post"
        target={`/${value.tokenInfo.chainId}/${value.tokenInfo.address}`}
      >
        Cancel
      </Button>,
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
