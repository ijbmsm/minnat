import { Suspense } from "react";
import { IssuesPage } from "@/components/issues-page";
import { getEvents } from "@/lib/data";
import { Nav } from "@/components/nav";

export const metadata = {
  title: "이슈 타임라인 — 민낯",
  description: "공식 처분 기반 정치 사건 타임라인",
};

export const revalidate = 300;

function IssuesSkeleton() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <div className="mb-2 h-9 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="mb-8 h-5 w-72 animate-pulse rounded bg-white/3" />
        <div className="mb-8 h-10 w-80 animate-pulse rounded-lg bg-white/5" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </main>
    </>
  );
}

async function IssuesContent() {
  const events = await getEvents();
  return <IssuesPage events={events} />;
}

export default function Page() {
  return (
    <Suspense fallback={<IssuesSkeleton />}>
      <IssuesContent />
    </Suspense>
  );
}
