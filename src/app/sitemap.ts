import type { MetadataRoute } from "next";
import { getPresidents } from "@/lib/data";
import { listStories } from "@/lib/stories";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * 사이트맵용 이슈 목록 — id·created_at 만, 1000행씩 끊어서 전부.
 * getIssues() 를 쓰면 PostgREST 기본 상한(1000행)에 걸려 3천여 건 중 1000건만 들어갔다 (2026-11-02).
 */
async function allIssueStamps(): Promise<{ id: string; created_at: string }[]> {
  const supabase = createPublicClient();
  const PAGE = 1000;
  const out: { id: string; created_at: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("issues")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://drinkplace.kr";

  let issues: { id: string; created_at: string }[] = [];
  let presidents: Awaited<ReturnType<typeof getPresidents>> = [];

  try {
    [issues, presidents] = await Promise.all([allIssueStamps(), getPresidents()]);
  } catch (e) {
    console.warn("sitemap: DB 조회 실패, 정적 페이지만 반환", e);
  }

  const issueUrls = issues.map((issue) => ({
    url: `${baseUrl}/issues/${issue.id}`,
    lastModified: new Date(issue.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 사안 페이지는 검색 유입의 실제 착지점이다 — 목록만 넣으면 개별 사안이 안 잡힌다
  const stories = await listStories();
  const storyUrls = stories.map((s) => ({
    url: `${baseUrl}/stories/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const presidentUrls = presidents.map((p) => ({
    url: `${baseUrl}/politicians/presidents/${p.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // lastmod 는 실제로 바뀐 날짜만 준다. 매번 new Date() 를 주면 구글이 이 사이트의 lastmod 를 통째로 무시한다.
  // 목록 페이지는 가장 최근 항목 날짜, 내용이 고정인 페이지는 생략한다.
  const latestIssue = issues[0] ? new Date(issues[0].created_at) : undefined;
  // listStories 는 진행중·규모순 정렬이라 [0] 이 최신이 아니다 — 최댓값을 직접 구한다
  const storyStamps = stories.map((s) => s.updated_at).filter((t): t is string => !!t).sort();
  const latestStory = storyStamps.length ? new Date(storyStamps[storyStamps.length - 1]) : undefined;

  return [
    { url: baseUrl,                              lastModified: latestIssue, changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/saju`,                   changeFrequency: "daily",   priority: 0.9 },
    // 사주 풀이 5종 — 검색 유입의 실제 착지 페이지다. /saju 만 넣으면 이 키워드들이 잡히지 않는다.
    { url: `${baseUrl}/saju/full`,              changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/saju/today`,             changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/saju/love`,              changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/saju/career`,            changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/saju/compat`,            changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/politics`,               lastModified: latestIssue, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/issues`,                 lastModified: latestIssue, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/stories`,                lastModified: latestStory, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/politicians`,            changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/politicians/presidents`, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/about`,                  changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/explore`,                changeFrequency: "weekly",  priority: 0.6 },
    ...storyUrls,
    ...presidentUrls,
    ...issueUrls,
  ];
}
