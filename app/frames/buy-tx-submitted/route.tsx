import {
  Execute,
  MAINNET_RELAY_API,
  TESTNET_RELAY_API,
  paths,
} from "@reservoir0x/relay-sdk";
import { kv } from "@vercel/kv";
import { Button } from "frames.js/next";
import { frames } from "../frames";
import { TESTNET_ENABLED } from "../../env";
import { SwapRoute } from "@uniswap/smart-order-router";
import { getSwapTransaction } from "../../uniswap";
import { getClient } from "../../client";

type RelayStatusResponse =
  paths["/intents/status"]["get"]["responses"]["200"]["content"]["application/json"];

function getBlockExplorerTarget({
  txHash,
  key,
}: {
  txHash: string;
  key: string;
}) {
  const searchParams = new URLSearchParams({ key });
  return {
    pathname: `/block-explorer/tx/${txHash}`,
    query: { back: `/buy-tx-submitted?${searchParams.toString()}` },
  };
}

const handler = frames(async (ctx) => {
  try {
    const key = ctx.searchParams.key;

    if (!key) {
      throw new Error("Key not found");
    }

    const value = await kv.get<{
      steps: Execute["steps"];
      quote: SwapRoute;
      params: Parameters<typeof getSwapTransaction>[0];
    }>(key);

    if (!value) {
      throw new Error("Transaction not found");
    }

    const { steps } = value;

    const check = steps?.[0].items?.[0].check;

    if (!check?.endpoint) {
      console.error(
        "Could not find check endpoint on Relay",
        JSON.stringify(steps)
      );
      throw new Error("Could not find transaction on Relay");
    }

    // Call check endpoint and report progress
    const relayApiUrl = TESTNET_ENABLED ? TESTNET_RELAY_API : MAINNET_RELAY_API;
    const relayResponse = await fetch(
      new URL(check.endpoint, relayApiUrl).toString()
    );
    if (relayResponse.status !== 200) {
      const data = await relayResponse.json();
      console.error(data);
      throw new Error(
        `Failed to execute call: ${data.message} status: ${relayResponse.status}`
      );
    }

    const buyUrl = `/${value.params.chainId}/${value.params.outTokenAddress}`;

    // Report progress
    const checkResult = (await relayResponse.json()) as RelayStatusResponse;

    console.log(JSON.stringify(checkResult));

    const destinationClient = getClient({
      chainIdOrName: value.params.chainId,
    });

    if (checkResult.status === "success") {
      return {
        image: <div tw="flex">Transaction successful!</div>,
        buttons: [
          <Button action="post" target={buyUrl}>
            Buy more
          </Button>,
          checkResult.inTxHashes?.[0] ? (
            <Button
              action="post"
              target={getBlockExplorerTarget({
                txHash: checkResult.inTxHashes[0],
                key,
              })}
            >
              In tx ↗︎
            </Button>
          ) : null,
          checkResult.txHashes?.[0] ? (
            <Button
              action="post"
              target={getBlockExplorerTarget({
                txHash: checkResult.txHashes[0],
                key,
              })}
            >
              {`${destinationClient.chain.name} tx ↗︎`}
            </Button>
          ) : null,
        ],
      };
    } else if (
      checkResult.status === "pending" ||
      checkResult.status === "unknown"
    ) {
      return {
        image: (
          <div tw="flex">
            Transaction in progress...{" "}
            {checkResult.details ? `(${checkResult.details})` : ""}
          </div>
        ),
        buttons: [
          <Button action="post" target={buyUrl}>
            Buy more
          </Button>,
          <Button
            action="post"
            target={{ pathname: "/buy-tx-submitted", query: { key } }}
          >
            ⟲ Check again
          </Button>,
          checkResult.inTxHashes?.[0] ? (
            <Button
              action="post"
              target={getBlockExplorerTarget({
                txHash: checkResult.inTxHashes[0],
                key,
              })}
            >
              In tx ↗︎
            </Button>
          ) : null,
        ],
      };
    }

    return {
      image: <div tw="flex">Unknown transaction state</div>,
      buttons: [
        <Button
          action="post"
          target={{ pathname: "/buy-tx-submitted", query: { key } }}
        >
          ⟲ Check again
        </Button>,
      ],
    };
  } catch (error) {
    return {
      image: (
        <div tw="flex">
          {typeof error === "object" && error && "message" in error
            ? (error.message as string)
            : "An error occurred"}{" "}
          - contact @stephancill on farcaster
        </div>
      ),
      buttons: [
        <Button action="post" target="/">
          ← Back
        </Button>,
      ],
    };
  }
});

export const GET = handler;
export const POST = handler;
