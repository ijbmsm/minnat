import { HomePage } from "@/components/home-page";
import { getEvents } from "@/lib/data";

export const revalidate = 300;

export default async function Page() {
  const events = await getEvents({ limit: 200 });
  return <HomePage events={events} />;
}
