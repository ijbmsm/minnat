"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-5xl font-bold text-white/15">오류</h1>
      <p className="mb-2 text-sm text-white/40">
        페이지를 불러오는 중 문제가 발생했습니다.
      </p>
      <p className="mb-6 text-xs text-white/20">{error.digest}</p>
      <button
        onClick={reset}
        className="rounded-lg border border-white/10 px-5 py-2 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
      >
        다시 시도
      </button>
    </main>
  );
}
