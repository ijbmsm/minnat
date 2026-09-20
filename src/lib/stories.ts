import { createClient } from "@/lib/supabase/server";
import type {
  Camp, EvidenceGrade, IssueCategory, Storyline, StorylineSummary, StoryChapter, StoryArticle,
} from "@/types";
import { deriveGrade } from "@/lib/story-format";
import { CATEGORY_MAP } from "@/lib/constants";

export { deriveGrade, storyDuration, campBalance } from "@/lib/story-format";

/**
 * 사안 조회 — 원본은 DB 다.
 *
 * 원고를 파일로 두고 사람이 쓰던 구조를 버렸다. 기사 본문(issues.summary)은 이미
 * 크롤러가 쓰는데 사안 원고만 사람에게 맡기면 기능이 멈춘다. 이제 크롤러가
 * storylines / storyline_chapters / storyline_articles 를 만들고 갱신한다.
 */

interface StoryRow {
  id: string;
  slug: string;
  title: string;
  blurb: string | null;
  lead: string[] | null;
  camp: Camp | "both" | null;
  status: "ongoing" | "closed";
  status_label: string | null;
  started_at: string | null;
  ended_at: string | null;
  outcome: { label: string; description: string } | null;
  figures: { value: string; label: string }[] | null;
  people: { name: string; role: string; chapter_positions?: number[] }[] | null;
  updated_at: string;
}

const STORY_COLUMNS =
  "id, slug, title, blurb, lead, camp, status, status_label, started_at, ended_at, outcome, figures, people, updated_at";

export async function listStories(): Promise<StorylineSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("storylines")
    .select(STORY_COLUMNS)
    .eq("hidden", false)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as StoryRow[];
  const counts = await countArticlesBySlug(rows.map((r) => r.id));
  return rows
    .map((r) => toSummary(r, counts.get(r.id) ?? { chapters: 0, articles: 0 }))
    .sort((a, b) => {
      // 진행중이 먼저. 그 안에서는 규모(근거 기사 수) 순 — 큰 사안이 위로 와야 한다.
      // 최신순으로만 두면 어제 난 단발 뉴스가 몇 년짜리 사안을 밀어낸다
      if (a.status !== b.status) return a.status === "ongoing" ? -1 : 1;
      if (b.article_count !== a.article_count) return b.article_count - a.article_count;
      return (b.started_at ?? "").localeCompare(a.started_at ?? "");
    });
}

export async function getStory(slug: string): Promise<Storyline | null> {
  const supabase = await createClient();
  const { data: story } = await supabase
    .from("storylines")
    .select(STORY_COLUMNS)
    .eq("slug", slug)
    .eq("hidden", false)
    .maybeSingle<StoryRow>();
  if (!story) return null;

  const { data: chapterRows } = await supabase
    .from("storyline_chapters")
    .select("id, position, when_label, title, body, link, link_is_causal, grade")
    .eq("storyline_id", story.id)
    .order("position");

  const chapters = chapterRows ?? [];
  const { data: articleRows } = await supabase
    .from("storyline_articles")
    .select("id, chapter_id, issue_id, score, issues(id, title, summary, published_at, source_name, source_tier, category, criminal_stage, verified, source_url, cross_verified_sources)")
    .eq("storyline_id", story.id)
    .eq("hidden", false);

  const byChapter = new Map<string, StoryArticle[]>();
  for (const row of articleRows ?? []) {
    // PostgREST 는 조인 결과를 관계에 따라 객체로도 배열로도 준다
    const joined = (row as unknown as { issues?: IssueJoin | IssueJoin[] }).issues;
    const issue = Array.isArray(joined) ? joined[0] : joined;
    if (!issue || !row.chapter_id) continue;
    const list = byChapter.get(row.chapter_id) ?? [];
    list.push(toArticle(row.id, issue));
    byChapter.set(row.chapter_id, list);
  }

  const ordinal = (n: number) => "①②③④⑤⑥⑦⑧⑨⑩"[n - 1] ?? `${n}`;
  const built: StoryChapter[] = chapters.map((c, i) => ({
    id: c.id,
    ordinal: ordinal(c.position),
    when: c.when_label ?? "",
    grade: (c.grade ?? "claim") as EvidenceGrade,
    title: c.title,
    body: c.body ?? "",
    // 마지막 장에는 다음으로 잇는 줄을 두지 않는다
    link: i === chapters.length - 1 ? undefined : c.link || undefined,
    articles: (byChapter.get(c.id) ?? []).sort((a, b) =>
      a.published_at.localeCompare(b.published_at),
    ),
  }));

  return {
    ...toSummary(story, { chapters: built.length, articles: built.reduce((n, c) => n + c.articles.length, 0) }),
    lead: story.lead ?? [],
    figures: story.figures ?? [],
    people: (story.people ?? []).map((p) => ({
      name: p.name,
      role: p.role,
      chapter_ids: (p.chapter_positions ?? [])
        .map((pos) => chapters.find((c) => c.position === pos)?.id)
        .filter((v): v is string => Boolean(v)),
    })),
    chapters: built,
    disputes: [],
    next_branch: null,
    outcome: story.outcome,
    related: [],
  };
}

export async function listStorySlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("storylines").select("slug").eq("hidden", false);
  return (data ?? []).map((r) => r.slug as string);
}

// ── 파생 ──

interface IssueJoin {
  id: string;
  title: string;
  summary: string | null;
  published_at: string;
  source_name: string | null;
  source_tier: number | null;
  category: string | null;
  criminal_stage: string | null;
  verified: boolean | null;
  source_url: string | null;
  cross_verified_sources: { name: string }[] | null;
}

function toArticle(rowId: string, issue: IssueJoin): StoryArticle {
  return {
    id: rowId,
    title: issue.title,
    published_at: (issue.published_at ?? "").slice(0, 10),
    source_name: issue.source_name ?? "출처 미상",
    // 내부 카테고리 키(criminal_conviction)를 그대로 노출하지 않는다
    source_kind: CATEGORY_MAP[(issue.category ?? "") as IssueCategory]?.label ?? "",
    grade: deriveGrade(issue),
    body: issue.summary ?? undefined,
    source_url: issue.source_url ?? undefined,
    issue_id: issue.id,
    cross_verified: (issue.cross_verified_sources ?? []).map((s) => s.name).filter(Boolean),
  };
}

function toSummary(row: StoryRow, counts: { chapters: number; articles: number }): StorylineSummary {
  return {
    slug: row.slug,
    title: row.title,
    camp: row.camp ?? "both",
    status: row.status,
    status_label: row.status_label ?? "",
    started_at: row.started_at ?? "",
    ended_at: row.ended_at,
    blurb: row.blurb ?? "",
    chapter_count: counts.chapters,
    article_count: counts.articles,
  };
}

async function countArticlesBySlug(ids: string[]) {
  const out = new Map<string, { chapters: number; articles: number }>();
  if (ids.length === 0) return out;
  const supabase = await createClient();
  const [{ data: chapters }, { data: articles }] = await Promise.all([
    supabase.from("storyline_chapters").select("storyline_id").in("storyline_id", ids),
    supabase.from("storyline_articles").select("storyline_id").in("storyline_id", ids).eq("hidden", false),
  ]);
  for (const id of ids) out.set(id, { chapters: 0, articles: 0 });
  for (const c of chapters ?? []) out.get(c.storyline_id)!.chapters += 1;
  for (const a of articles ?? []) out.get(a.storyline_id)!.articles += 1;
  return out;
}

