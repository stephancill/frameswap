import { NextRequest } from "next/server";
import { getAndPersistSwapTransaction } from "../../uniswap";

/**
 * Generates a quote for a the swap transaction and persists it
 * @param req parameters for the swap transaction
 * @returns
 */
export async function POST(req: NextRequest) {
  const params: Parameters<typeof getAndPersistSwapTransaction>[0] =
    await req.json();

  await getAndPersistSwapTransaction(params);

  return new Response("Ok", { status: 200 });
}
