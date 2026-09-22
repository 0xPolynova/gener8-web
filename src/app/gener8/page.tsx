import type { Metadata } from "next";
import { Gener8TokenPage } from "@/components/token/Gener8TokenPage";

export const metadata: Metadata = {
  title: "$GENER8",
  description:
    "Hold GENER8 to unlock Gener8. Three tiers — Access, Creator, and Studio — with more generations and models as your balance grows.",
};

export default function Page() {
  return <Gener8TokenPage />;
}
