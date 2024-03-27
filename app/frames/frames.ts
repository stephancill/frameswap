import { createFrames } from "frames.js/next";
import { FramesMiddleware } from "frames.js/types";
import { isFrameDefinition } from "frames.js/utils";
import { imageUrl } from "../utils";

const imageMiddleware: FramesMiddleware<any, {}> = async (ctx, next) => {
  const nextResult = await next();

  if (isFrameDefinition(nextResult) && typeof nextResult.image !== "string") {
    const image = imageUrl(nextResult.image);
    return {
      ...nextResult,
      image,
    };
  }

  return nextResult;
};

export const frames = createFrames({
  basePath: "/frames",
  middleware: [imageMiddleware],
});
