import { kv } from "@vercel/kv";
import { frames } from "../frames";
import { Button } from "frames.js/next";

export const POST = frames(async (ctx) => {
  const key = ctx.searchParams.key;

  const value = await kv.get<any>(key);

  if (!value) {
    return {
      image: <div>Quote not found</div>,
    };
  }

  if (value.quote) {
    return {
      image: (
        <div>
          <div>Quote found</div>
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

  return {
    image: <div>Error: {value.error}</div>,
    buttons: [
      // TODO: this should go to the frame url
      <Button action="post" target={{ pathname: "/" }}>
        Back
      </Button>,
    ],
  };
});
