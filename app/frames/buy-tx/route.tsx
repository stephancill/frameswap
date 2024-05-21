import type { SwapRoute } from "@uniswap/smart-order-router";
import { kv } from "@vercel/kv";
import { TransactionTargetResponse } from "frames.js";
import { DUMMY_TX_ADDRESS } from "../../const";
import { getSwapTransaction } from "../../uniswap";
import { createRelayCallAuto } from "../../utils";
import { frames } from "../frames";

export const POST = frames(async (ctx) => {
  try {
    const connectedAddress = ctx.message?.connectedAddress;

    if (!connectedAddress) {
      throw new Error("No connected address found");
    }

    const key = ctx.searchParams.key;

    if (!key) {
      throw new Error("Key not found");
    }

    const value = await kv.get<{
      quote: SwapRoute;
      params: Parameters<typeof getSwapTransaction>[0];
    }>(key);

    if (!value) {
      throw new Error("Quote not found");
    }

    const { quote, params } = value;

    if (!quote.methodParameters) {
      throw new Error("Method parameters not found");
    }

    // Replace dummy address in calldata
    const tx = {
      ...quote.methodParameters,
      data: quote.methodParameters.calldata.replace(
        DUMMY_TX_ADDRESS.toLowerCase().slice(2),
        connectedAddress.toLowerCase().slice(2)
      ),
    };

    const { steps, fundsChainId } = await createRelayCallAuto({
      call: {
        destinationChainId: value.params.chainId,
        txs: [tx],
      },
      connectedAddress: connectedAddress as `0x${string}`,
    });

    kv.set(key, JSON.stringify({ ...value, steps }));

    const relayTxData = steps[0].items?.[0].data;

    const txResponse: TransactionTargetResponse = {
      chainId: `eip155:${fundsChainId}`,
      method: "eth_sendTransaction",
      params: {
        abi: [],
        to: relayTxData.to,
        value: relayTxData.value,
        data: relayTxData.data,
      },
    };

    return Response.json(txResponse);
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
});
