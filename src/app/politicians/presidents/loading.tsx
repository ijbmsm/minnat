import { Nav } from "@/components/nav";

export default function Loading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-20 md:px-8">
        <div className="mb-6 h-5 w-24 animate-pulse rounded bg-white/5" />
        <div className="mb-3 h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="mb-12 h-5 w-80 animate-pulse rounded bg-white/3" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[1.25rem] bg-white/[0.03]" />
          ))}
        </div>
      </main>
    </>
  );
}
