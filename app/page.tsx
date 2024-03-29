import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { Logo } from "./components/logo";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Frames Next.js Example",
    other: {
      ...(await fetchMetadata(
        new URL("/frames", process.env.APP_URL || "http://localhost:3000")
      )),
    },
  };
}

export default async function Home() {
  return <div>Frameswap</div>;
}
