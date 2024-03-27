import { frames } from "./frames";

const handleRequest = frames(async (ctx) => {
  return {
    image: "https://example.com/image.png",
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
