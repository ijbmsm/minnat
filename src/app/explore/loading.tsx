import { Nav } from "@/components/nav";

export default function Loading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-20 md:px-8">
        <div className="mb-8 h-9 w-32 animate-pulse rounded-lg bg-white/5" />
        <div className="mb-8 h-12 w-full animate-pulse rounded-xl bg-white/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
      </main>
    </>
  );
}
