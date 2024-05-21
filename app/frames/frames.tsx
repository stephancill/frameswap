import { ClientProtocolHandler, openframes } from "frames.js/middleware";
import { createFrames } from "frames.js/next";
import { FramesMiddleware } from "frames.js/types";
import { isFrameDefinition } from "frames.js/utils";
import { getClient } from "../client";
import { Scaffold } from "../components/scaffold";
import { imageUrl } from "../render-image";
import { getTokenInfo } from "../token";
import { getEthUsdPrice } from "../utils";

const imageMiddleware: FramesMiddleware<any, {}> = async (ctx, next) => {
  const nextResult = await next();

  if (!isFrameDefinition(nextResult) || typeof nextResult.image === "string") {
    return nextResult;
  }

  const image =
    imageUrl(<Scaffold>{nextResult.image}</Scaffold>) + `&${Date.now()}`;

  return {
    ...nextResult,
    image,
  };
};

export const tokenMiddleware = ({
  chain: overrideChain,
  address: overrideAddress,
}:
  | {
      chain?: string;
      address?: string;
    }
  | undefined = {}) => {
  const middlewareFn: FramesMiddleware<
    any,
    {
      token?: Awaited<ReturnType<typeof getTokenInfo>> & {
        chain: string;
        address: string;
      };
    }
  > = async (ctx, next) => {
    const url = new URL(ctx.url);
    const tokenAddress = overrideAddress || url.searchParams.get("address");
    const chainIdOrNameRaw = overrideChain || url.searchParams.get("chain");

    if (tokenAddress && chainIdOrNameRaw) {
      const chainIdOrName: string | number = isNaN(parseInt(chainIdOrNameRaw))
        ? chainIdOrNameRaw
        : parseInt(chainIdOrNameRaw);

      const client = getClient({ chainIdOrName });

      const token = await getTokenInfo({
        chainIdOrName: client.chainName,
        addressOrId: tokenAddress,
      });

      if (token) {
        return next({
          token: { ...token, chain: client.chainName, address: tokenAddress },
        });
      }
    }

    return next();
  };
  return middlewareFn;
};

export const priceMiddleware: FramesMiddleware<
  any,
  { ethUsd: number }
> = async (ctx, next) => {
  const ethPrice = await getEthUsdPrice();
  return next({ ethUsd: ethPrice });
};

const openFramesHandler: ClientProtocolHandler<{
  buttonIndex: any;
  inputText: any;
  connectedAddress: any;
  transactionId: any;
  state: any;
}> = {
  isValidPayload(body) {
    const rawBody = body as any;
    return (
      rawBody.untrustedData && rawBody.untrustedData.buttonIndex !== undefined
    );
  },
  async getFrameMessage(body) {
    const rawBody = body as any;

    return {
      buttonIndex: rawBody.untrustedData.buttonIndex,
      inputText: rawBody.untrustedData.inputText,
      connectedAddress: rawBody.untrustedData.address,
      transactionId: rawBody.untrustedData.transactionId,
      state: rawBody.untrustedData.state,
    };
  },
};

export const frames = createFrames({
  baseUrl: `${process.env.APP_URL}/frames`,
  middleware: [
    imageMiddleware,
    openframes({
      clientProtocol: {
        id: "xmtp",
        version: "2024-02-09",
      },
      handler: openFramesHandler,
    }),
    openframes({
      clientProtocol: {
        id: "*",
        version: "*",
      },
      handler: openFramesHandler,
    }),
  ],
});
