import { Suspense } from "react";
import { ExplorePage } from "@/components/explore-page";
import { getIssues, getEvents } from "@/lib/data";
import { Nav } from "@/components/nav";

export const metadata = {
  title: "탐색",
  description: "이슈 버블 맵, 타임라인, 전체 사건 탐색",
};

export const revalidate = 300;

function ExploreSkeleton() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-20">
        <div className="mb-8 h-9 w-32 animate-pulse rounded-lg bg-white/5" />
        <div className="mb-8 h-10 w-full animate-pulse rounded-lg bg-white/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
      </main>
    </>
  );
}

async function ExploreContent() {
  const [issues, events] = await Promise.all([
    getIssues({ limit: 500 }),
    getEvents({ limit: 300 }),
  ]);
  return <ExplorePage issues={issues} events={events} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreContent />
    </Suspense>
  );
}
