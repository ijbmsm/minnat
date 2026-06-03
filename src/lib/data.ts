import { createClient } from "@/lib/supabase/server";
import type { Issue, IssueEvent, Politician, ScoreSnapshot, PresidentProfile, PresidentFull, CreditEvent, SimilarCase } from "@/types";

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

  return {
    ...event,
    member_issues: memberIssues,
  } as IssueEvent;
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
