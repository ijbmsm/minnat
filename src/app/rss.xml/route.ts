import { getIssues } from "@/lib/data";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  let issues: Awaited<ReturnType<typeof getIssues>> = [];
  try {
    issues = await getIssues({ limit: 50 });
  } catch {
    issues = [];
  }

  const items = issues
    .map((issue) => {
      const pubDate = new Date(issue.published_at).toUTCString();
      return `
    <item>
      <title>${escapeXml(issue.title)}</title>
      <link>https://drinkplace.kr/issues/${issue.id}</link>
      <description>${escapeXml(issue.summary)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">https://drinkplace.kr/issues/${issue.id}</guid>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>술자리 — 정치 이슈</title>
    <link>https://drinkplace.kr/issues</link>
    <description>공식 처분 기반 정치 이슈 타임라인. 검찰·법원·윤리위·감사원·팩트체크 기관 처분만.</description>
    <language>ko</language>
    <atom:link href="https://drinkplace.kr/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
