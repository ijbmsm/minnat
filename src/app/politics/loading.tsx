import { Nav } from "@/components/nav";

/**
 * 목록 페이지 전용 로딩 화면. 이 폴더에는 [id]/[slug] 같은 하위 동적 경로를 두지 말 것 —
 * loading.tsx 아래에서 notFound() 가 나면 상태 코드가 200 으로 굳어 소프트 404 가 된다.
 */
export default function Loading() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <div className="mb-2 h-9 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="mb-10 h-5 w-72 animate-pulse rounded bg-white/[0.03]" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </main>
    </>
  );
}
