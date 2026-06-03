import { getSimilarEvents } from "@/lib/data";
import { SimilarCasesContent } from "./similar-cases-section";

interface SimilarCasesLoaderProps {
  eventId: string;
}

export async function SimilarCasesLoader({ eventId }: SimilarCasesLoaderProps) {
  const similar = await getSimilarEvents(eventId);
  if (similar.length === 0) return null;
  return <SimilarCasesContent cases={similar} />;
}
