import { createClient } from "@/lib/supabase/server";
import type { Issue, IssueEvent, Politician, ScoreSnapshot, PresidentProfile, PresidentFull, CreditEvent, SimilarCase, Camp } from "@/types";

export async function getIssues(options?: {
  camp?: string;
  category?: string;
  limit?: number;
}): Promise<Issue[]> {
  const supabase = await createClient();
  let query = supabase
    .from("issues")
    .select("*")
    .order("published_at", { ascending: false });

  if (options?.camp) {
    query = query.eq("camp", options.camp);
  }
  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[data] getIssues error:", error.message);
    return [];
  }
  return data as Issue[];
}

export async function getIssueById(id: string): Promise<Issue | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[data] getIssueById error:", error.message);
    return null;
  }
  return data as Issue;
}

export async function getPoliticians(activeOnly = true): Promise<Politician[]> {
  const supabase = await createClient();
  let query = supabase
    .from("politicians")
    .select("*, party:parties(*)")
    .order("name");

  if (activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[data] getPoliticians error:", error.message);
    return [];
  }
  return data as Politician[];
}

export async function getPoliticianById(id: string): Promise<Politician | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("politicians")
    .select("*, party:parties(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[data] getPoliticianById error:", error.message);
    return null;
  }
  return data as Politician;
}

export async function getIssuesByPolitician(name: string): Promise<Issue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("actor_name", name)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[data] getIssuesByPolitician error:", error.message);
    return [];
  }
  return data as Issue[];
}

// ── Event 조회 ──

const EVENT_SELECT_COLUMNS = "id, representative_issue_id, actor_name, category, camp, issue_count, coverage_count, headline_days, media_diversity_score, trust_level, verified, weighted_score, cross_verified_sources, first_reported_at, last_reported_at, criminal_stage, position_weight, source_tier, summary, is_active, created_at";

export async function getEvents(options?: {
  camp?: string;
  category?: string;
  limit?: number;
}): Promise<IssueEvent[]> {
  const supabase = await createClient();
  let query = supabase
    .from("issue_clusters")
    .select(EVENT_SELECT_COLUMNS)
    .order("last_reported_at", { ascending: false });

  if (options?.camp) {
    query = query.eq("camp", options.camp);
  }
  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[data] getEvents error:", error.message);
    return [];
  }
  return (data ?? []) as IssueEvent[];
}

export async function getEventById(id: string): Promise<IssueEvent | null> {
  const supabase = await createClient();

  // event 조회 (embedding 제외 — 1536차원 벡터는 프론트에서 불필요)
  const { data: event, error } = await supabase
    .from("issue_clusters")
    .select(EVENT_SELECT_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !event) {
    console.error("[data] getEventById error:", error?.message);
    return null;
  }

  // member issues 조회
  const { data: links } = await supabase
    .from("cluster_issues")
    .select("issue_id")
    .eq("cluster_id", id);

  const issueIds = links?.map((l) => l.issue_id) ?? [];
  let memberIssues: Issue[] = [];

  if (issueIds.length > 0) {
    const { data: issues } = await supabase
      .from("issues")
      .select("*")
      .in("id", issueIds)
      .order("published_at", { ascending: false });
    memberIssues = (issues ?? []) as Issue[];
  }

  // next_branch (021) 는 따로 가져온다 — EVENT_SELECT_COLUMNS 에 넣으면
  // 마이그레이션 전 환경에서 event 조회 전체가 400 으로 죽는다.
  const nextBranch = await getNextBranch(supabase, id);

  return {
    ...event,
    ...(nextBranch ? { next_branch: nextBranch } : {}),
    member_issues: memberIssues,
  } as IssueEvent;
}

/** 021 미적용 환경에서는 조용히 null. 컬럼이 생기면 자동으로 살아난다. */
async function getNextBranch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
): Promise<IssueEvent["next_branch"] | null> {
  try {
    const { data, error } = await supabase
      .from("issue_clusters")
      .select("next_branch")
      .eq("id", eventId)
      .maybeSingle<{ next_branch: IssueEvent["next_branch"] }>();
    if (error || !data?.next_branch) return null;
    return data.next_branch;
  } catch {
    return null;
  }
}

export async function getEventByIssueId(issueId: string): Promise<IssueEvent | null> {
  const supabase = await createClient();

  // issue의 event_id 조회
  const { data: issue } = await supabase
    .from("issues")
    .select("event_id")
    .eq("id", issueId)
    .single();

  if (!issue?.event_id) return null;
  return getEventById(issue.event_id);
}

export async function getEventsByPolitician(name: string): Promise<IssueEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_clusters")
    .select(EVENT_SELECT_COLUMNS)
    .eq("actor_name", name)
    .order("last_reported_at", { ascending: false });

  if (error) {
    console.error("[data] getEventsByPolitician error:", error.message);
    return [];
  }
  return (data ?? []) as IssueEvent[];
}

// ── 감경 이벤트 ──

export async function getCreditsForEvent(eventId: string): Promise<CreditEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_events")
    .select("*")
    .eq("event_id", eventId)
    .eq("verified", true)
    .order("effective_date", { ascending: false });

  if (error) {
    console.error("[data] getCreditsForEvent error:", error.message);
    return [];
  }
  return (data ?? []) as CreditEvent[];
}

export async function getCreditsByActor(actorName: string): Promise<CreditEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_events")
    .select("*")
    .eq("actor_name", actorName)
    .eq("verified", true)
    .order("effective_date", { ascending: false });

  if (error) {
    console.error("[data] getCreditsByActor error:", error.message);
    return [];
  }
  return (data ?? []) as CreditEvent[];
}

// ── 유사 사례 ──

export async function getSimilarEvents(eventId: string): Promise<SimilarCase[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("match_similar_events", {
      query_event_id: eventId,
      match_count: 5,
      similarity_threshold: 0.5,
    });

  if (error) {
    console.error("[data] getSimilarEvents error:", error.message);
    return [];
  }
  return (data ?? []) as SimilarCase[];
}

// ── 스냅샷 ──

export async function getLatestSnapshot(): Promise<ScoreSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("[data] getLatestSnapshot error:", error.message);
    return null;
  }
  return data as ScoreSnapshot;
}

// ── 전 대통령 ──

export async function getPresidents(): Promise<PresidentProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("president_profiles")
    .select("*, politician:politicians(*, party:parties(*))")
    .order("term_number", { ascending: true });

  if (error) {
    console.error("[data] getPresidents error:", error.message);
    return [];
  }
  return (data ?? []) as PresidentProfile[];
}

export async function getPresidentById(id: string): Promise<PresidentFull | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("president_profiles")
    .select("*, politician:politicians(*, party:parties(*))")
    .eq("id", id)
    .single();

  if (error || !profile) {
    console.error("[data] getPresidentById error:", error?.message);
    return null;
  }

  // 관련 데이터 병렬 조회
  const [associates, pardons, economy, promises, appointments] = await Promise.all([
    supabase.from("president_associates").select("*").eq("president_id", id).order("date", { ascending: true }).then(r => r.data ?? []),
    supabase.from("president_pardons").select("*").eq("president_id", id).order("pardon_date", { ascending: true }).then(r => r.data ?? []),
    supabase.from("president_economy").select("*").eq("president_id", id).order("year", { ascending: true }).then(r => r.data ?? []),
    supabase.from("president_promises").select("*").eq("president_id", id).then(r => r.data ?? []),
    supabase.from("president_appointments").select("*").eq("president_id", id).order("date", { ascending: true }).then(r => r.data ?? []),
  ]);

  // 사법 기록 이벤트
  const politicianName = (profile as PresidentProfile).politician?.name;
  let events: IssueEvent[] = [];
  if (politicianName) {
    const { data: evts } = await supabase
      .from("issue_clusters")
      .select(EVENT_SELECT_COLUMNS)
      .eq("actor_name", politicianName)
      .order("last_reported_at", { ascending: false });
    events = (evts ?? []) as IssueEvent[];
  }

  return {
    ...profile,
    associates,
    pardons,
    economy,
    promises,
    appointments,
    events,
  } as PresidentFull;
}

// ── 맞불 구도 · 등장 정치인 ────────────────────────────────────────────────
//
// 스키마에 "이 사안에 대한 진영별 입장" 필드는 없다. 대신 같은 인물을 두고 나온
// 다른 기록을 모아 진영별로 가른다. 지어내지 않고 이미 있는 기록만 줄 세우는 것이라
// "판단은 사용자 몫" 원칙에 어긋나지 않는다.
//
// 양쪽 진영이 모두 있을 때만 의미가 있으므로, 한쪽이라도 비면 null 을 반환해
// 화면에서 섹션 자체가 사라지게 한다.

export interface StanceItem {
  issueId:     string;
  actorName:   string | null;
  camp:        Camp;
  title:       string;
  publishedAt: string;
}

export interface Stances {
  /** 이 대치의 중심 인물 */
  subject: string;
  blue:    StanceItem[];
  red:     StanceItem[];
}

/** PostgREST `or=` 값에 들어갈 수 없는 문자를 막는다 (쉼표·괄호·따옴표·와일드카드) */
function safeIlikeTerm(s: string): string | null {
  const t = s.trim();
  if (t.length < 2 || t.length > 20) return null;
  if (/[,()"'*%\\]/.test(t)) return null;
  return t;
}

/** 이 사안(=중심 인물)을 두고 나온 다른 진영의 기록. 양쪽이 다 있을 때만 반환. */
export async function getStances(issue: Issue): Promise<Stances | null> {
  const subject = issue.actor_name ? safeIlikeTerm(issue.actor_name) : null;
  if (!subject) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .select("id, title, camp, actor_name, published_at")
    .or(`title.ilike.*${subject}*,summary.ilike.*${subject}*`)
    .neq("id", issue.id)
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[data] getStances error:", error.message);
    return null;
  }

  const rows = (data ?? []) as Pick<Issue, "id" | "title" | "camp" | "actor_name" | "published_at">[];
  const seen = new Set<string>();
  const blue: StanceItem[] = [];
  const red:  StanceItem[] = [];

  for (const r of rows) {
    // 같은 사람의 같은 날 기록은 한 발언이 매체별로 중복 저장된 것으로 본다
    // (크롤러 dedup 미흡 — CLAUDE.md "알려진 이슈" 참고)
    const key = `${r.actor_name ?? ""}:${r.published_at.slice(0, 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const item: StanceItem = {
      issueId: r.id, actorName: r.actor_name, camp: r.camp,
      title: r.title, publishedAt: r.published_at,
    };
    (r.camp === "blue" ? blue : red).push(item);
  }

  if (blue.length === 0 || red.length === 0) return null;
  return { subject, blue: blue.slice(0, 5), red: red.slice(0, 5) };
}

export interface IssueFigure {
  /** politicians 테이블에 없으면 null — 이 경우 링크를 걸지 않는다 */
  id:          string | null;
  name:        string;
  camp:        Camp;
  position:    string | null;
  partyName:   string | null;
  /** 이 사안에서 이 사람 이름으로 남은 기록 제목 하나 */
  roleLine:    string;
  /** 전체 기록 수 */
  totalRecords: number;
  isSubject:   boolean;
}

/** 이 사안에 등장한 정치인 — 본인 + 맞불 기록의 인물들. politicians 로 보강. */
export async function getIssueFigures(issue: Issue, stances: Stances | null): Promise<IssueFigure[]> {
  const order: { name: string; camp: Camp; roleLine: string; isSubject: boolean }[] = [];
  const push = (name: string | null, camp: Camp, roleLine: string, isSubject: boolean) => {
    if (!name) return;
    if (order.some(o => o.name === name)) return;
    order.push({ name, camp, roleLine, isSubject });
  };

  push(issue.actor_name, issue.camp, issue.title, true);
  for (const s of [...(stances?.blue ?? []), ...(stances?.red ?? [])]) {
    push(s.actorName, s.camp, s.title, false);
  }
  if (order.length < 2) return [];

  const names = order.map(o => o.name);
  const supabase = await createClient();

  const [{ data: profiles }, { data: counts }] = await Promise.all([
    supabase.from("politicians").select("id, name, position, party:parties(name)").in("name", names),
    supabase.from("issues").select("actor_name").in("actor_name", names),
  ]);

  type ProfileRow = { id: string; name: string; position: string | null; party: { name: string } | { name: string }[] | null };
  const byName = new Map<string, ProfileRow>();
  for (const p of (profiles ?? []) as ProfileRow[]) byName.set(p.name, p);

  const countByName = new Map<string, number>();
  for (const c of (counts ?? []) as { actor_name: string | null }[]) {
    if (c.actor_name) countByName.set(c.actor_name, (countByName.get(c.actor_name) ?? 0) + 1);
  }

  return order.map(o => {
    const p = byName.get(o.name);
    const party = Array.isArray(p?.party) ? p?.party[0] : p?.party;
    return {
      id: p?.id ?? null,
      name: o.name,
      camp: o.camp,
      position: p?.position ?? null,
      partyName: party?.name ?? null,
      roleLine: o.roleLine,
      totalRecords: countByName.get(o.name) ?? 0,
      isSubject: o.isSubject,
    };
  });
}
