import type { Route } from "./+types/home";
import { BatchTrackerApp } from "../components/batch-tracker-app";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "BatchTracker DApp" },
    { name: "description", content: "Blockchain-based batch tracking application" },
  ];
}

export default function Home() {
  return <BatchTrackerApp />;
}
