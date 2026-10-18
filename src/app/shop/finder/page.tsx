import type { Metadata } from "next";
import { QuizFlow } from "@/components/shop/QuizFlow";

export const metadata: Metadata = {
  title: "Plant finder | Hlaza",
  description:
    "Four questions about your light, your habits and your history. Get an honest shortlist of plants that will actually survive your room.",
};

export default function FinderPage() {
  return <QuizFlow />;
}
