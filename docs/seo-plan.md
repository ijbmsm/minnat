# SEO 실행 계획 — 술자리 (drinkplace.kr)

> 소스코드 직접 분석 기준. 파일 경로·구체 수정 사항 명시.  
> 작성일: 2026-06-08

---

## 현황 요약

| 항목 | 상태 |
|------|------|
| metadataBase / 글로벌 OG | ✅ `layout.tsx` |
| robots.txt | ⚠️ Yeti 룰 누락 |
| sitemap.xml | ⚠️ 누락 페이지 있음 |
| 이슈 상세 메타 + JSON-LD | ✅ `issues/[id]/page.tsx` |
| 정치인 상세 메타 | ⚠️ canonical·OG이미지·Person schema 누락 |
| 사주 결과 페이지 메타 | ❌ generateMetadata 없음 + 로그인 필요 = 인덱싱 불가 |
| 사주 공유 페이지 (`/saju/view/[id]`) | ❌ generateMetadata 없음 |
| OG 이미지 생성 | ✅ `/api/og`, `/api/saju/og` 구현됨 — 메타에 미연결 |
| About(방법론) 페이지 | ⚠️ canonical 없음, structured data 없음 |
| JSON-LD 컴포넌트 | ✅ Organization·Website·Breadcrumb·Article |

---

## P0 — 지금 당장 (누락 = 크롤 오류)

### 1. robots.ts — Yeti 룰 추가

**파일:** `src/app/robots.ts`

현재 `*` 룰 하나만 있어서 네이버봇이 별도 허용 시그널 없음.

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/", "/mypage/", "/report/"],
      },
      {
        userAgent: "Yeti",   // 네이버봇 전체 허용
        allow: "/",
        disallow: "",
      },
    ],
    sitemap: "https://drinkplace.kr/sitemap.xml",
  };
}
```

> `/auth/`, `/mypage/`, `/report/` 도 disallow 추가 — 현재 노출돼 있음.

---

### 2. sitemap.ts — 누락 페이지 추가

**파일:** `src/app/sitemap.ts`

현재 정적 목록에 `/saju`, `/about`, `/politicians` 등 누락.

```typescript
// 정적 페이지 목록 교체
return [
  { url: baseUrl,                              priority: 1.0, changeFrequency: "daily"   },
  { url: `${baseUrl}/saju`,                   priority: 0.9, changeFrequency: "daily"   },
  { url: `${baseUrl}/politics`,               priority: 0.9, changeFrequency: "daily"   },
  { url: `${baseUrl}/issues`,                 priority: 0.9, changeFrequency: "daily"   },
  { url: `${baseUrl}/politicians`,            priority: 0.8, changeFrequency: "weekly"  },
  { url: `${baseUrl}/politicians/presidents`, priority: 0.8, changeFrequency: "weekly"  },
  { url: `${baseUrl}/explore`,               priority: 0.6, changeFrequency: "weekly"  },
  { url: `${baseUrl}/about`,                 priority: 0.7, changeFrequency: "monthly" },
  ...presidentUrls,
  ...issueUrls,
]
```

> `/saju/view/[id]` (공개 공유 페이지)도 DB에서 공개된 것만 추가 권장.

---

## P1 — 이번 주 (직접 랭킹 영향)

### 3. issues/[id]/page.tsx — OG 이미지 연결

**파일:** `src/app/issues/[id]/page.tsx`

`/api/og` 라우트가 구현됐는데 generateMetadata에 images가 없음.

```typescript
openGraph: {
  title: issue.title,
  description: issue.summary,
  type: "article",
  publishedTime: issue.published_at,
  url: `https://drinkplace.kr/issues/${id}`,
  images: [{                                      // ← 추가
    url: `https://drinkplace.kr/api/og?issueId=${id}`,
    width: 1200,
    height: 630,
  }],
},
twitter: {
  card: "summary_large_image",                    // ← summary → summary_large_image
  title: issue.title,
  description: issue.summary,
},
```

---

### 4. saju/view/[id]/page.tsx — generateMetadata 추가

**파일:** `src/app/saju/view/[id]/page.tsx`

공개 공유 페이지인데 메타 완전 없음. 카카오·트위터 공유 시 빈 카드로 노출됨.

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // public API로 읽기 (인증 불필요)
  const supabase = await createClient();
  const { data: reading } = await supabase
    .from("saju_readings")
    .select("reading_type, birth_year, day_master_stem, day_master_branch")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!reading) return { title: "사주 풀이 — 술자리" };

  const typeLabel = {
    full: "종합 사주",
    love: "연애운",
    career: "직업운",
    today: "오늘 운세",
  }[reading.reading_type] ?? "사주 풀이";

  const dayMaster = `${reading.day_master_stem}${reading.day_master_branch}`;

  return {
    title: `${dayMaster}일주 ${typeLabel} — 술자리`,
    description: `${reading.birth_year}년생 ${dayMaster}일주 사주 AI 분석. 무료 공개 풀이.`,
    alternates: { canonical: `https://drinkplace.kr/saju/view/${id}` },
    openGraph: {
      title: `${dayMaster}일주 ${typeLabel}`,
      description: `${reading.birth_year}년생 사주 AI 풀이`,
      images: [{ url: `https://drinkplace.kr/api/saju/og?id=${id}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}
```

---

### 5. politicians/[id]/page.tsx — 메타 보강 + Person schema

**파일:** `src/app/politicians/[id]/page.tsx`

canonical 없고 OG 없고 Person structured data 없음.

```typescript
// generateMetadata 교체
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const politician = await getPoliticianById(id);
  if (!politician) return { title: "정치인을 찾을 수 없습니다 — 술자리" };

  return {
    title: `${politician.name} 행보 — 술자리`,
    description: `${politician.name}(${politician.party?.name}, ${politician.position}) 관련 이슈 기록. 공식 처분 기반 팩트만.`,
    alternates: { canonical: `https://drinkplace.kr/politicians/${id}` },
    openGraph: {
      title: `${politician.name} — 술자리`,
      description: `${politician.name} 이슈 기록`,
      url: `https://drinkplace.kr/politicians/${id}`,
    },
  };
}

// 페이지 컴포넌트에 Person JSON-LD 추가
// json-ld.tsx에 PersonJsonLd 컴포넌트 추가 후:
<PersonJsonLd
  name={politician.name}
  jobTitle={politician.position}
  affiliation={politician.party?.name}
  url={`https://drinkplace.kr/politicians/${id}`}
/>
```

**json-ld.tsx에 추가할 컴포넌트:**
```typescript
export function PersonJsonLd({
  name, jobTitle, affiliation, url,
}: {
  name: string; jobTitle?: string; affiliation?: string; url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    affiliation: affiliation ? { "@type": "Organization", name: affiliation } : undefined,
    url,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

---

### 6. about/page.tsx — canonical + Dataset schema

**파일:** `src/app/about/page.tsx`

방법론 공개 페이지는 E-E-A-T에서 핵심인데 canonical도 structured data도 없음.

```typescript
export const metadata: Metadata = {
  title: "방법론 — 술자리",
  description: "술자리의 점수 산출 방법론, 데이터 수집 기준, 신뢰도 게이트를 전체 공개합니다.",
  alternates: { canonical: "https://drinkplace.kr/about" },   // ← 추가
};
```

페이지 컴포넌트에 Dataset JSON-LD 추가:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "대한민국 정치인 공식 처분 데이터",
  description: "검찰·법원·윤리위·감사원·팩트체크 기관의 공식 처분 기반 정치 이슈 데이터",
  creator: { "@type": "Organization", name: "술자리", url: "https://drinkplace.kr" },
  license: "https://drinkplace.kr/about",
  inLanguage: "ko-KR",
  isAccessibleForFree: true,
}) }} />
```

---

## P2 — 이번 달 (트래픽 확보)

### 7. 사주 페이지 인덱싱 전략

**현황:** `/saju/[type]/[id]` 는 로그인 필수 → Googlebot 접근 불가 → 인덱싱 0.

**옵션 A (권장):** `/saju/view/[id]` 공개 페이지를 SEO 랜딩으로 활용
- 풀이 결과를 공개로 전환 시 공유 링크 = `/saju/view/[id]`
- P1 #4에서 이미 metadata 추가 예정
- sitemap에 공개된 reading ID 목록 추가

**옵션 B:** `/saju` 랜딩 페이지 메타 강화 (현재 너무 단순)

```typescript
// src/app/saju/page.tsx metadata 교체
export const metadata: Metadata = {
  title: "무료 사주팔자 AI 풀이 — 술자리",
  description: "생년월일시 입력 → 전통 명리학 기반 AI 사주 분석. 종합·연애운·직업운·오늘운세 무료 제공.",
  keywords: ["무료 사주", "사주팔자", "AI 사주", "오늘 운세", "연애운 사주", "직업운"],
  alternates: { canonical: "https://drinkplace.kr/saju" },
  openGraph: {
    title: "무료 사주팔자 AI 풀이 — 술자리",
    description: "전통 명리학 기반 AI 사주 분석. 무료.",
    url: "https://drinkplace.kr/saju",
  },
};
```

WebApplication JSON-LD도 추가:
```typescript
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "술자리 사주",
  description: "전통 명리학 기반 AI 사주팔자 풀이",
  url: "https://drinkplace.kr/saju",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  inLanguage: "ko-KR",
}
```

---

### 8. ArticleJsonLd — dateModified 추가

**파일:** `src/components/json-ld.tsx`

현재 `ArticleJsonLd`에 `dateModified` 없음. Google News 요구사항.

```typescript
export function ArticleJsonLd({ title, description, datePublished, dateModified, url }: {
  title: string; description: string;
  datePublished: string; dateModified?: string; url: string;
}) {
  const data = {
    ...
    datePublished,
    dateModified: dateModified ?? datePublished,   // ← 추가
    ...
  };
}
```

`issues/[id]/page.tsx`에서:
```typescript
<ArticleJsonLd
  ...
  dateModified={issue.updated_at ?? issue.published_at}   // ← 추가
/>
```

---

### 9. 정치인 목록 / 이슈 목록 메타 보강

**파일:** `src/app/politicians/page.tsx`, `src/app/issues/page.tsx`

현재 정적 문자열만. canonical 추가 + 동적 count 반영.

```typescript
// politicians/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  const politicians = await getPoliticians(false);
  return {
    title: `정치인 ${politicians.length}명 행보 기록 — 술자리`,
    description: "현직·전직 정치인의 이슈 기록. 공식 처분 기반 팩트만.",
    alternates: { canonical: "https://drinkplace.kr/politicians" },
  };
}

// issues/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "이슈 타임라인 — 술자리",
    description: "공식 처분 기반 정치 사건 타임라인. 검찰·법원·윤리위·감사원·팩트체크 기관 처분만.",
    alternates: { canonical: "https://drinkplace.kr/issues" },
  };
}
```

---

## P3 — 출시 후 (트래픽 기반 확장)

### 10. FAQPage schema — 사주 랜딩

사주 관련 자주 묻는 질문을 `/saju` 페이지 하단에 추가 + FAQPage JSON-LD.
People Also Ask 점령 목적.

예시 FAQ:
- "사주팔자란 무엇인가요?"
- "무료로 사주를 볼 수 있나요?"
- "AI 사주 풀이는 얼마나 정확한가요?"
- "일주란 무엇인가요?"

### 11. 네이버 RSS 피드

**파일 신규:** `src/app/rss.xml/route.ts`

이슈 업데이트를 RSS로 제공 → 네이버 서치어드바이저 RSS 제출.
네이버 검색에서 이슈 페이지 크롤 속도 향상.

```typescript
export async function GET() {
  const issues = await getRecentIssues(50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>술자리 — 정치 이슈</title>
    <link>https://drinkplace.kr/issues</link>
    <description>공식 처분 기반 정치 이슈 타임라인</description>
    <language>ko</language>
    ${issues.map(issue => `
    <item>
      <title>${escapeXml(issue.title)}</title>
      <link>https://drinkplace.kr/issues/${issue.id}</link>
      <description>${escapeXml(issue.summary)}</description>
      <pubDate>${new Date(issue.published_at).toUTCString()}</pubDate>
      <guid>https://drinkplace.kr/issues/${issue.id}</guid>
    </item>`).join("")}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
```

### 12. Google Analytics 4 설치

현재 코드베이스에 GA4 없음. 트래픽 분석 없이 SEO 성과 측정 불가.

`layout.tsx`에 추가:
```typescript
// next/third-parties 사용 (공식 권장, 성능 최적화됨)
import { GoogleAnalytics } from "@next/third-parties/google";

// <body> 안에
<GoogleAnalytics gaId="G-XXXXXXXXXX" />
```

---

## 작업 우선순위 체크리스트

```
P0 (오늘):
☐ robots.ts — Yeti 룰 + /auth /mypage 차단
☐ sitemap.ts — /saju /about /politicians 추가

P1 (이번 주):
☐ issues/[id] — OG 이미지 연결, twitter card → summary_large_image
☐ saju/view/[id] — generateMetadata 추가
☐ politicians/[id] — canonical + PersonJsonLd
☐ about — canonical + Dataset JSON-LD

P2 (이번 달):
☐ saju/page.tsx — 메타 강화 + WebApplication JSON-LD
☐ ArticleJsonLd — dateModified 추가
☐ politicians/page, issues/page — canonical + 동적 count

P3 (출시 후):
☐ FAQPage schema (/saju)
☐ RSS 피드 → 네이버 서치어드바이저 제출
☐ GA4 설치
☐ Vercel Analytics 활성화 (Core Web Vitals 실사용자 데이터)
```

---

*기준: 소스코드 직접 분석 | 2026-06-08*
