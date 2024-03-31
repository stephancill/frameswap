import {
  MAINNET_RELAY_API,
  TESTNET_RELAY_API,
  paths,
} from "@reservoir0x/relay-sdk";
import { kv } from "@vercel/kv";
import { Button } from "frames.js/next";
import { getClient } from "../../client";
import { Heading } from "../../components/heading";
import { TESTNET_ENABLED } from "../../env";
import { formatUsdDisplay, formatWarpcastIntentUrl } from "../../utils";
import { frames } from "../frames";
import { KVTransacted } from "../types";

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

    const value = await kv.get<KVTransacted>(key);

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

    const castUrl = formatWarpcastIntentUrl({
      text: `I just bought ${formatUsdDisplay(value.quote.quote.amount)} ${
        value.tokenInfo.symbol
      } right from my feed using FRAMESWAP 😎⚡️`,
      chain: value.tokenInfo.chainId,
      address: value.tokenInfo.address,
    });
    const shareButton = (
      <Button action="link" target={castUrl}>
        Share
      </Button>
    );

    const buyMoreButton = (
      <Button action="post" target={buyUrl}>
        ⟲ Buy more
      </Button>
    );

    // Report progress
    const checkResult = (await relayResponse.json()) as RelayStatusResponse;

    console.log(JSON.stringify(checkResult));

    const destinationClient = getClient({
      chainIdOrName: value.params.chainId,
    });

    if (checkResult.status === "success") {
      return {
        image: <Heading>TRANSACTION SUCCESSFUL</Heading>,
        buttons: [
          buyMoreButton,
          shareButton,
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
          <div tw="flex flex-col">
            <Heading>TRANSACTION IN PROGRESS</Heading>
            <div>
              {checkResult.details
                ? `${checkResult.details.toUpperCase()}`
                : ""}
            </div>
          </div>
        ),
        buttons: [
          buyMoreButton,
          shareButton,
          <Button
            action="post"
            target={{
              pathname: "/buy-tx-submitted",
              query: { key, time: Date.now() },
            }}
          >
            ⟲ Check again
          </Button>,
        ],
      };
    }

    return {
      image: <Heading>UNKNOWN TRANSACTION STATE</Heading>,
      buttons: [
        <Button
          action="post"
          target={{
            pathname: "/buy-tx-submitted",
            query: { key, time: Date.now() },
          }}
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
