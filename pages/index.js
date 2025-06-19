import dynamic from "next/dynamic";

const SynqtrisGame = dynamic(() => import("../components/SynqtrisGame"), { ssr: false });

export default function Home() {
  return <SynqtrisGame />;
}