import { createClient } from "@/lib/supabase/server";
import type { Issue, Politician, ScoreSnapshot } from "@/types";

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

export async function getPoliticians(): Promise<Politician[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("politicians")
    .select("*, party:parties(*)")
    .eq("active", true)
    .order("name");

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
