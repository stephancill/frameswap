import { createFrames } from "frames.js/next";
import { FramesMiddleware } from "frames.js/types";
import { isFrameDefinition } from "frames.js/utils";
import { imageUrl } from "../render-image";
import { getTokenInfo } from "../token";
import { getClient } from "../client";
import { getEthUsdPrice } from "../utils";

const imageMiddleware: FramesMiddleware<any, {}> = async (ctx, next) => {
  const nextResult = await next();

  if (isFrameDefinition(nextResult) && typeof nextResult.image !== "string") {
    const image = imageUrl(nextResult.image) + `&${Date.now()}`;
    return {
      ...nextResult,
      image,
    };
  }

  return nextResult;
};

export const tokenMiddleware: FramesMiddleware<
  any,
  {
    token?: Awaited<ReturnType<typeof getTokenInfo>> & {
      chain: string;
      address: string;
    };
  }
> = async (ctx, next) => {
  const url = new URL(ctx.url);
  const tokenAddress = url.searchParams.get("address");
  const chainNameOrId = url.searchParams.get("chain");

  if (tokenAddress && chainNameOrId) {
    const token = await getTokenInfo({
      blockchain: chainNameOrId,
      tokenAddress,
    });

    if (token) {
      return next({
        token: { ...token, chain: chainNameOrId, address: tokenAddress },
      });
    }
  }

  return next();
};

export const priceMiddleware: FramesMiddleware<
  any,
  { ethUsd: number }
> = async (ctx, next) => {
  const ethPrice = await getEthUsdPrice();
  return next({ ethUsd: ethPrice });
};

export const frames = createFrames({
  basePath: "/frames",
  middleware: [imageMiddleware],
});
