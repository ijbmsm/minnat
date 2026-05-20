import type { MetadataRoute } from "next";
import { MOCK_ISSUES } from "@/lib/mock-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://minnat.kr";

  const issueUrls = MOCK_ISSUES.map((issue) => ({
    url: `${baseUrl}/issues/${issue.id}`,
    lastModified: new Date(issue.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/issues`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/policies`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...issueUrls,
  ];
}
