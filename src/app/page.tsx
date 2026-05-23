import { HomePage } from "@/components/home-page";
import { getIssues, getEvents } from "@/lib/data";

export const revalidate = 300;

export default async function Page() {
  const [issues, events] = await Promise.all([
    getIssues({ limit: 200 }),
    getEvents({ limit: 100 }),
  ]);
  return <HomePage issues={issues} events={events} />;
}
