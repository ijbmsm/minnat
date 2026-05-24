import { Nav } from "@/components/nav";

export default function Loading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-20 md:px-8">
        <div className="mb-2 h-9 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="mb-10 h-5 w-72 animate-pulse rounded bg-white/3" />
        <div className="mb-14 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.02]" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.02]" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
