import type { MetadataRoute } from "next";
import { getIssues, getPresidents } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://drinkplace.kr";

  let issues: Awaited<ReturnType<typeof getIssues>> = [];
  let presidents: Awaited<ReturnType<typeof getPresidents>> = [];

  try {
    [issues, presidents] = await Promise.all([getIssues(), getPresidents()]);
  } catch (e) {
    console.warn("sitemap: DB 조회 실패, 정적 페이지만 반환", e);
  }

  const issueUrls = issues.map((issue) => ({
    url: `${baseUrl}/issues/${issue.id}`,
    lastModified: new Date(issue.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const presidentUrls = presidents.map((p) => ({
    url: `${baseUrl}/politicians/presidents/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/saju`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/issues`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/politicians`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/politicians/presidents`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...presidentUrls,
    ...issueUrls,
  ];
}
