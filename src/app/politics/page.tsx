import { HomePage } from "@/components/home-page";
import { getEvents } from "@/lib/data";

export const revalidate = 300;

export default async function Page() {
  const events = await getEvents({ limit: 1000 });
  return <HomePage events={events} />;
}
