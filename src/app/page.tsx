import { HomePage } from "@/components/home-page";
import { getIssues } from "@/lib/data";

export const revalidate = 300;

export default async function Page() {
  const issues = await getIssues({ limit: 200 });
  return <HomePage issues={issues} />;
}
