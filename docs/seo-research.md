# SEO 최적화 리서치 — 2026 실무 기준

> 대상 니치: **사주/운세** + **정치/뉴스** (무료 서비스 기반)  
> 스택: Next.js 16 App Router + Vercel  
> 작성일: 2026-06-08

---

## 목차

1. [2026 SEO 패러다임 전환](#1-2026-seo-패러다임-전환)
2. [한국 검색 시장 구조](#2-한국-검색-시장-구조)
3. [니치별 키워드 전략](#3-니치별-키워드-전략)
4. [기술 SEO 체크리스트](#4-기술-seo-체크리스트)
5. [구조화 데이터 (Schema.org)](#5-구조화-데이터-schemaorg)
6. [콘텐츠 전략](#6-콘텐츠-전략)
7. [Core Web Vitals 최적화](#7-core-web-vitals-최적화)
8. [Next.js 구현 레시피](#8-nextjs-구현-레시피)
9. [추천 라이브러리](#9-추천-라이브러리)
10. [네이버 SEO 전용 전략](#10-네이버-seo-전용-전략)
11. [성과 측정](#11-성과-측정)

---

## 1. 2026 SEO 패러다임 전환

### 1-1. AI Overview (SGE) 시대

구글이 AI 요약(AI Overviews)을 한국 검색에도 전면 적용한 2026년, 검색 결과 구조가 근본적으로 바뀌었다.

| 구분 | Before (2024) | After (2026) |
|------|--------------|--------------|
| 1위 클릭률 | ~28% | ~18% (AI가 흡수) |
| Featured Snippet | 최상단 1박스 | AI Overview 내 인용으로 통합 |
| Zero-click | ~50% | ~65%+ |
| 살아남는 포지션 | 상위 3개 | AI 인용 소스 OR 하위 4~10위 |

**결론:** 클릭을 노리려면 AI Overview에 인용되거나, AI가 처리 못하는 개인화/실시간 데이터를 제공해야 한다.

**사주/운세 사이트에 유리한 이유:**
- "오늘 내 운세" → AI가 맞춤형 사주 계산 불가 (생년월일 + 시간 입력 필요)
- 개인화 = AI Overview 우회 → 클릭 유도 가능

**정치 사이트에 불리한 이유:**
- 뉴스성 쿼리는 AI Overview가 요약 → 클릭률 급감
- 살아남으려면 **오리지널 리포팅** 또는 **데이터 시각화** 필수

---

### 1-2. E-E-A-T 강화 (2026 업데이트)

Google의 2026 Helpful Content Update v3 이후, E-E-A-T(경험·전문성·권위·신뢰)가 랭킹 직접 인자로 격상됨.

| 요소 | 실무 구현 |
|------|---------|
| Experience | 작성자 바이오 페이지 (`/author/[slug]`) + 실제 경험 언급 |
| Expertise | 전문가 인용, 출처 링크, 참고문헌 섹션 |
| Authoritativeness | 외부 언론/사이트로부터 백링크, 위키피디아 언급 |
| Trustworthiness | HTTPS, Privacy Policy, 오탈자 없는 콘텐츠, 연락처 명시 |

**사주 니치 E-E-A-T (AI 서비스 기준):**
- About 페이지에 엔진 알고리즘 설명 (전통 명리학 기반 + 오픈소스 계산 로직 공개)
- "이 풀이는 AI가 생성했습니다" 명시 → 투명성이 곧 신뢰
- 사주 계산 근거 노출 (일주·월주·대운 수치 표시) → Expertise 시그널
- WebApplication Schema + `isAccessibleForFree: true` 선언

**정치 니치 E-E-A-T (데이터 집계 서비스 기준):**
- About 페이지에 점수 산출 공식 공개 (scoring formula 투명화)
- 데이터 출처 명기: 국회 API, 법원, 선관위, JTBC/MBC 팩트체크 등 Tier 표기
- "공식 처분만 점수화" 원칙 페이지로 문서화 → methodology 페이지
- Dataset Schema로 데이터 출처 구조화

---

### 1-3. 모바일 & 인텐트 우선

- 한국 모바일 검색 비율: **92%** (2026 기준)
- 구글 Mobile-First Indexing 100% 적용 완료
- 검색 인텐트 4분류: Informational / Navigational / Commercial / Transactional
  - 사주: **Informational** (오늘 운세) + **Transactional** (유료 상담 예약)
  - 정치: **Informational** (뉴스) + **Commercial** (뉴스레터 구독)

---

## 2. 한국 검색 시장 구조

### 점유율 (2026 추정)

| 검색엔진 | PC 점유율 | 모바일 점유율 |
|---------|---------|------------|
| 네이버 | 52% | 58% |
| 구글 | 38% | 31% |
| 다음 | 8% | 9% |
| 기타 | 2% | 2% |

### 핵심 차이

| 구분 | 구글 | 네이버 |
|------|------|-------|
| 크롤러 | Googlebot | Yeti |
| 메타 중요도 | title·description·structured data | title·description·키워드 밀도 |
| 블로그 인덱싱 | 외부 도메인 우선 | 네이버 블로그 우선 |
| 뉴스 | Google News 등록 필요 | 네이버 뉴스 제휴 필요 |
| 운세 키워드 | 구조화 데이터 우선 | 네이버 지식iN + 블로그 강세 |

**결론:** 두 엔진을 독립적으로 최적화해야 한다. 공통 기반(메타태그·속도)은 하나로, 네이버 전용 대응은 별도로.

---

## 3. 니치별 키워드 전략

### 3-1. 사주/운세 니치

#### 시드 키워드 (월 검색량 추정, 네이버+구글 합산)

| 키워드 | 월 검색량 | 경쟁도 | 인텐트 |
|--------|---------|-------|-------|
| 오늘 운세 | 500,000+ | 최상 | Informational |
| 무료 사주 | 200,000+ | 상 | Informational |
| 2026 사주 | 150,000+ | 상 | Informational |
| 사주팔자 보는법 | 80,000 | 중 | Informational |
| 무료 사주 풀이 | 60,000 | 중 | Informational |
| 오늘 띠별 운세 | 50,000 | 중 | Informational |
| 2026 토정비결 | 40,000 | 중 | Informational |
| 연애운 사주 | 35,000 | 중하 | Informational |
| 직장운 2026 | 30,000 | 중하 | Informational |
| 사주 상담 무료 | 25,000 | 하 | Commercial |

#### 롱테일 키워드 패턴 (경쟁도 낮고 전환율 높음)

```
{띠} + {연도} + 운세         → 예: "용띠 2026 운세"
{별자리} + {월} + 운세       → 예: "천칭자리 7월 운세"
{생년} + {월} + 사주         → 예: "1990년생 6월 사주"
무료 + {특정 운} + 사주      → 예: "무료 재물운 사주"
{이름} + 사주 + 무료         → 예: "사주 이름 풀이 무료"
```

#### 콘텐츠 캘린더 기반 키워드 (타이밍 SEO)

| 시기 | 집중 키워드 | 발행 타이밍 |
|------|----------|-----------|
| 매일 | 오늘 운세, 오늘 {띠} 운세 | 매일 00:00 갱신 |
| 매주 | 이번주 운세, 주간 운세 | 매주 일요일 23:00 |
| 매월 | {월}월 운세, {월}월 사주 | 전월 25일 |
| 연초 | 2026 운세, 2026 사주 | 12월 15일부터 |
| 명절 | 설날 운세, 추석 운세 | 명절 2주 전 |

---

### 3-2. 정치 니치

#### 핵심 키워드 분류

**상시 키워드 (Evergreen)**
| 키워드 | 월 검색량 | 전략 |
|--------|---------|-----|
| 한국 정치 | 80,000 | 카테고리 랜딩 |
| 국회 뉴스 | 60,000 | 뉴스 허브 |
| 대통령 지지율 | 40,000 | 데이터 페이지 |
| 선거 일정 | 35,000 | 정보성 페이지 |
| 정당 지지율 | 30,000 | 여론조사 집계 |
| 국회의원 | 25,000 | DB 페이지 |

**이슈 키워드 (Trending)**
- 검색량이 갑자기 급증하는 뉴스 키워드
- 전략: **Google Trends API + 네이버 DataLab API** 모니터링 → 자동 알럿
- 대응: 이슈 발생 1시간 내 초안 발행, 2시간 내 완성본 (Speed-to-Rank)

**지역+정치 롱테일**
```
{지역구} + 국회의원 + {이름}
{정당} + {지역} + 여론조사
{이름} + 공약 + {연도}
```

---

## 4. 기술 SEO 체크리스트

### 4-1. 필수 메타태그 (Next.js generateMetadata)

실제 존재하는 라우트 기준으로 작성.

**사주 풀이 결과 페이지** (`/saju/[type]/[id]`)
```typescript
// app/saju/[type]/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const reading = await getReading(params.id)
  const typeLabel = { full: '종합', love: '연애운', career: '직업운', today: '오늘운세' }[params.type]

  return {
    title: `무료 사주 ${typeLabel} 풀이 — 술자리`,
    description: `${reading.birthYear}년생 ${reading.dayMaster}일주 사주 AI 분석. 일간 특성·대운·세운 기반 ${typeLabel} 풀이. 무료 제공.`,
    alternates: {
      canonical: `https://drinkplace.kr/saju/${params.type}/${params.id}`,
    },
    openGraph: {
      title: `사주 ${typeLabel} 풀이`,
      description: `${reading.dayMaster}일주 기반 AI 사주 분석`,
      url: `https://drinkplace.kr/saju/${params.type}/${params.id}`,
      images: [{ url: `/api/saju/og?id=${params.id}`, width: 1200, height: 630 }], // 이미 구현됨
    },
  }
}
```

**정치 이슈 페이지** (`/issues/[id]`)
```typescript
// app/issues/[id]/page.tsx — 이미 구현됨, 보완 포인트
export async function generateMetadata({ params }): Promise<Metadata> {
  const issue = await getIssue(params.id)

  return {
    title: `${issue.title} — 술자리`,
    description: `${issue.politician_name} ${issue.category} 이슈. 공식 처분 기반 팩트 정리.`,
    alternates: {
      canonical: `https://drinkplace.kr/issues/${params.id}`,
    },
    openGraph: {
      type: "article",
      publishedTime: issue.created_at,
      images: [{ url: `/api/og?issueId=${params.id}`, width: 1200, height: 630 }], // 이미 구현됨
    },
  }
}
```

### 4-2. Canonical URL 전략

중복 콘텐츠는 SEO 최대 적이다. 특히 운세 사이트는 날짜/파라미터 조합으로 URL이 폭발한다.

```
✅ Canonical 적용 필수 케이스:
- /saju?date=2026-06-08  →  canonical: /saju/2026-06-08
- /fortune?sign=aries     →  canonical: /fortune/aries
- /news?category=politics →  canonical: /news/politics

❌ canonical 없이 방치하면:
- 동일 내용 URL 수십 개 → 크롤 버짓 낭비 → 순위 희석
```

### 4-3. URL 구조 설계

**사주 사이트**
```
/                          # 홈 (오늘 운세 요약)
/saju                      # 사주 메인
/saju/[YYYY-MM-DD]         # 날짜별 운세 (매일 갱신)
/saju/ddi/[띠명]           # 띠별 운세
/saju/birth/[YYYYMMDD]     # 생년월일별 사주
/fortune/[별자리]          # 별자리 운세
/tojeong/[YYYY]            # 토정비결 연도별
/blog/[slug]               # 사주 관련 아티클
/author/[slug]             # 역술인 프로필 (E-E-A-T)
```

**정치 사이트**
```
/                          # 홈 (최신 뉴스 피드)
/news/[slug]               # 개별 뉴스
/news/category/[slug]      # 카테고리
/people/[politician-slug]  # 정치인 프로필 DB
/polls                     # 여론조사 집계
/polls/[date]              # 날짜별 지지율
/election/[year]           # 선거 정보
/region/[slug]             # 지역구별 정보
```

### 4-4. Sitemap 전략

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 사주: 최근 30일 날짜 페이지 + 12 띠 페이지 + 12 별자리
  const sajuDatePages = getLast30Days().map(date => ({
    url: `${base}/saju/${date}`,
    lastModified: new Date(date),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // 정치: 최근 뉴스 200개 (오래된 것은 priority 낮춤)
  const newsPages = await getRecentNews(200)
  const newsEntries = newsPages.map((news, i) => ({
    url: `${base}/news/${news.slug}`,
    lastModified: news.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: i < 20 ? 0.9 : 0.7, // 최신 20개 우선
  }))

  return [...staticPages, ...sajuDatePages, ...newsEntries]
}
```

**sitemap 분할 (1000개 넘으면):**
```
/sitemap.xml          # 인덱스 sitemap
/sitemap-static.xml   # 정적 페이지
/sitemap-saju.xml     # 사주 날짜 페이지
/sitemap-news.xml     # 뉴스 페이지
/sitemap-people.xml   # 정치인 DB
```

### 4-5. robots.txt

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/_next/',
        ],
      },
      {
        userAgent: 'Yeti', // 네이버봇 — 전체 허용
        allow: '/',
        disallow: '',
      },
      {
        userAgent: 'Twitterbot', // 트위터 OG 카드
        allow: '/',
        disallow: '',
      },
    ],
    sitemap: [
      'https://yourdomain.com/sitemap.xml',
    ],
  }
}
```

---

## 5. 구조화 데이터 (Schema.org)

구조화 데이터는 AI Overview 인용 가능성을 높이는 가장 직접적인 방법이다.

### 5-1. 사주/운세 스키마

```typescript
// 일별 운세 페이지용
const dailyFortuneSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "2026년 6월 8일 무료 운세",
  "datePublished": "2026-06-08T00:00:00+09:00",
  "dateModified": "2026-06-08T00:00:00+09:00",
  "author": {
    "@type": "Person",
    "name": "역술사 이름",
    "url": "https://yourdomain.com/author/slug",
    "sameAs": ["https://instagram.com/...", "https://blog.naver.com/..."]
  },
  "publisher": {
    "@type": "Organization",
    "name": "사이트명",
    "logo": { "@type": "ImageObject", "url": "https://yourdomain.com/logo.png" }
  },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://yourdomain.com/saju/2026-06-08" }
}

// FAQ 스키마 (People Also Ask 점령용)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "2026년 용띠 운세는 어떤가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "2026년 용띠는 병오년으로..."
      }
    },
    {
      "@type": "Question",
      "name": "무료 사주 풀이를 받을 수 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "생년월일시를 입력하면 바로 무료로..."
      }
    }
  ]
}

// BreadcrumbList
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://yourdomain.com" },
    { "@type": "ListItem", "position": 2, "name": "사주", "item": "https://yourdomain.com/saju" },
    { "@type": "ListItem", "position": 3, "name": "2026년 6월 8일 운세" }
  ]
}
```

### 5-2. 정치/뉴스 스키마

```typescript
// 뉴스 기사
const newsArticleSchema = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "기사 제목 (110자 이내)",
  "description": "기사 요약 (160자 이내)",
  "datePublished": "2026-06-08T14:30:00+09:00",
  "dateModified": "2026-06-08T15:00:00+09:00",
  "author": {
    "@type": "Person",
    "name": "기자명",
    "url": "https://yourdomain.com/author/reporter-slug"
  },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "미디어명",
    "logo": { "@type": "ImageObject", "url": "https://yourdomain.com/logo.png" }
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://yourdomain.com/images/article.jpg",
    "width": 1200,
    "height": 630
  },
  "articleSection": "정치",
  "keywords": ["국회", "여야", "법안"],
  "inLanguage": "ko-KR",
  "isAccessibleForFree": true  // 무료 콘텐츠 명시 중요!
}

// 정치인 프로필 페이지
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "홍길동",
  "jobTitle": "국회의원",
  "affiliation": { "@type": "Organization", "name": "민주당" },
  "url": "https://yourdomain.com/people/hong-gildong",
  "sameAs": ["https://assembly.go.kr/..."]
}

// 여론조사 데이터
const datasetSchema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "2026년 대통령 지지율 여론조사",
  "description": "주요 여론조사 기관별 대통령 지지율 집계",
  "datePublished": "2026-06-08",
  "creator": { "@type": "Organization", "name": "사이트명" }
}
```

### 5-3. Next.js에서 JSON-LD 삽입

```tsx
// components/JsonLd.tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// 페이지에서 사용
export default function SajuPage() {
  return (
    <>
      <JsonLd data={dailyFortuneSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* ... */}
    </>
  )
}
```

---

## 6. 콘텐츠 전략

### 6-1. Topic Cluster 구조

**허브 & 스포크 모델** — Google이 토픽 권위를 평가하는 방식.

**사주 토픽 클러스터**
```
[허브] /saju — "사주 완전 가이드"
  ├── [스포크] /saju/ddi/쥐띠
  ├── [스포크] /saju/ddi/소띠
  ├── ... (12띠)
  ├── [스포크] /fortune/양자리
  ├── ... (12별자리)
  ├── [스포크] /saju/2026 (연간 운세)
  └── [스포크] /blog/사주-보는-법 (하우투 아티클)

[허브] /tojeong — "토정비결"
  ├── [스포크] /tojeong/2026/쥐띠
  └── ...
```

**정치 토픽 클러스터**
```
[허브] /news — "정치 뉴스"
  ├── [스포크] /news/category/국회
  ├── [스포크] /news/category/선거
  ├── [스포크] /news/category/외교
  └── [스포크] /news/category/경제

[허브] /people — "정치인 DB"
  ├── [스포크] /people/{slug} (개별 정치인)
  └── [스포크] /people/party/{slug} (정당별)

[허브] /polls — "여론조사"
  ├── [스포크] /polls/president
  └── [스포크] /polls/party
```

### 6-2. 콘텐츠 갱신 전략 (Freshness Signal)

구글은 freshness를 랭킹 인자로 사용한다. 갱신 없이 방치된 페이지는 시간이 지날수록 순위 하락.

```
사주 갱신 주기:
- 오늘 운세 페이지: 매일 00:00 자동 생성 + ISR
- 주간/월간 운세: 주기적 갱신
- 연간 운세(2026): 1월에 발행, 이후 분기별 소폭 업데이트 (달성 예측 부분 추가)
- 블로그 아티클: 연 1회 이상 리뷰 후 "업데이트" 표기

정치 갱신 주기:
- 뉴스: 실시간 (발행 후 수정 시 dateModified 반드시 업데이트)
- 여론조사: 새 조사 발표 즉시
- 정치인 프로필: 주요 이슈 발생 시
```

### 6-3. 무료 서비스 SEO 특화 전략

**"무료" 키워드를 URL·title·h1에 명시적으로 사용하라**

```
❌ /fortune
✅ /fortune/free (또는 title에 "무료" 포함)

❌ title: "오늘 운세"
✅ title: "무료 오늘 운세 | {사이트명}"
```

**무료임을 구조화 데이터로도 선언:**
```json
{
  "@type": "WebApplication",
  "isAccessibleForFree": true,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  }
}
```

### 6-4. 사용자 생성 콘텐츠 (UGC) 활용

- 사주 사이트: 사용자 댓글/후기 ("작년 운세가 맞았어요")
  - 리뷰 Schema로 마크업 → 별점 리치 스니펫 노출 가능
- 정치 사이트: 댓글 섹션, 투표 기능
  - Comment Schema 적용

---

## 7. Core Web Vitals 최적화

Google 랭킹 직접 인자. 2026 기준 INP(Interaction to Next Paint)가 FID를 완전 대체.

### 목표 수치

| 지표 | Good | Needs Improvement | Poor |
|------|------|-------------------|------|
| LCP (최대 콘텐츠 렌더) | ≤ 2.5s | 2.5s~4s | > 4s |
| INP (상호작용 응답) | ≤ 200ms | 200~500ms | > 500ms |
| CLS (레이아웃 이동) | ≤ 0.1 | 0.1~0.25 | > 0.25 |

### LCP 최적화 (운세/뉴스 사이트 필수)

```tsx
// 히어로 이미지 preload
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />

// Next.js Image 컴포넌트 — priority 반드시 설정
<Image src="/hero.webp" priority={true} fetchPriority="high" />

// 폰트 preload (한국어 폰트는 무겁다)
<link
  rel="preload"
  href="/fonts/pretendard-variable.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

### INP 최적화

```tsx
// 무거운 연산은 Web Worker로
// 사주 계산 로직을 메인 스레드 밖으로
const worker = new Worker('/workers/saju-calculator.js')
worker.postMessage({ birthDate, birthTime })
worker.onmessage = (e) => setSajuResult(e.data)

// React 18 useTransition으로 비우선 업데이트 처리
import { useTransition } from 'react'
const [isPending, startTransition] = useTransition()
startTransition(() => setFilteredNews(filterNews(query)))
```

### CLS 방지

```tsx
// 광고/배너 영역 height 미리 확보
<div style={{ minHeight: '90px' }}>
  <AdBanner />
</div>

// 이미지 width/height 항상 명시
<Image width={800} height={450} alt="..." />

// 폰트 로딩 중 레이아웃 이동 방지
font-display: swap (Pretendard 기본값 확인)
```

---

## 8. Next.js 구현 레시피

### 8-1. 동적 OG 이미지 생성

```typescript
// app/og/saju/[date]/route.tsx  (ImageResponse)
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request, { params }: { params: { date: string } }) {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '1200px', height: '630px', background: '#1a1a2e', padding: '60px' }}>
        <div style={{ fontSize: '48px', color: '#gold', fontWeight: 'bold' }}>
          {params.date} 오늘의 운세
        </div>
        <div style={{ fontSize: '24px', color: '#ccc', marginTop: '20px' }}>
          띠별 · 별자리별 무료 사주 풀이
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

### 8-2. ISR로 날짜별 운세 페이지

```typescript
// app/saju/[date]/page.tsx
export const revalidate = 86400 // 24시간마다 재생성

export async function generateStaticParams() {
  // 미래 7일 + 과거 30일 사전 생성
  return getDayRange(-30, 7).map(date => ({ date }))
}

export default async function SajuDatePage({ params }) {
  const fortune = await getDailyFortune(params.date)
  // ...
}
```

### 8-3. 뉴스 페이지 ISR + on-demand revalidation

```typescript
// app/news/[slug]/page.tsx
export const revalidate = 3600 // 1시간

// 뉴스 수정 시 즉시 캐시 무효화
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  const { slug, secret } = await req.json()
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  revalidatePath(`/news/${slug}`)
  return Response.json({ revalidated: true })
}
```

### 8-4. 내부 링크 자동화 (토픽 클러스터 강화)

```typescript
// 사주 아티클 내에서 관련 키워드 자동 링크
const INTERNAL_LINKS = {
  '용띠': '/saju/ddi/용띠',
  '2026년 운세': '/saju/2026',
  '토정비결': '/tojeong/2026',
  '사주팔자': '/blog/사주팔자-보는-법',
}

function autoLink(content: string) {
  return Object.entries(INTERNAL_LINKS).reduce(
    (text, [keyword, url]) =>
      text.replace(new RegExp(`(?<![<"/])(${keyword})`, 'g'), `<a href="${url}">$1</a>`),
    content
  )
}
```

### 8-5. 구글 뉴스 등록 준비 (정치 사이트)

```typescript
// Google News 요구사항:
// 1. NewsArticle schema 필수
// 2. 기자 바이오 페이지
// 3. 연락처/소유자 정보 About 페이지
// 4. 광고와 콘텐츠 명확히 구분

// app/news/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticle(params.slug)
  return {
    // Google News 필수
    authors: [{ name: article.authorName, url: `/author/${article.authorSlug}` }],
    // 발행일 명시
    other: {
      'article:published_time': article.publishedAt.toISOString(),
      'article:modified_time': article.updatedAt.toISOString(),
      'article:section': '정치',
    }
  }
}
```

---

## 9. 추천 라이브러리

### 9-1. SEO 핵심

| 라이브러리 | 용도 | 추천도 |
|-----------|------|-------|
| **Next.js 내장 Metadata API** | title, description, OG | ⭐⭐⭐ (기본 사용) |
| **schema-dts** | TypeScript-typed Schema.org | ⭐⭐⭐ |
| **next-sitemap** | 복잡한 sitemap 생성 자동화 | ⭐⭐ (Next.js 내장으로 대체 가능) |

```bash
npm install schema-dts
```

```typescript
// schema-dts 사용 예시 — 타입 안전
import type { NewsArticle, WithContext } from 'schema-dts'

const schema: WithContext<NewsArticle> = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: '제목',
  // 타입 오류 자동 감지
}
```

### 9-2. 성능 최적화

| 라이브러리 | 용도 | 추천도 |
|-----------|------|-------|
| **@vercel/og** (next/og 내장) | 동적 OG 이미지 | ⭐⭐⭐ |
| **sharp** | 서버사이드 이미지 리사이즈 | ⭐⭐⭐ |
| **@plaiceholder/next** | 이미지 blur placeholder | ⭐⭐ |

### 9-3. 콘텐츠 관리

| 라이브러리 | 용도 | 추천도 |
|-----------|------|-------|
| **contentlayer2** | MDX 기반 콘텐츠 (블로그/아티클) | ⭐⭐⭐ |
| **velite** | contentlayer 대안 (더 가벼움) | ⭐⭐⭐ |
| **next-mdx-remote** | 원격 MDX 렌더링 | ⭐⭐ |

```bash
# velite 추천 (contentlayer2 후계)
npm install velite
```

### 9-4. 분석/모니터링

| 도구 | 용도 | 비용 |
|------|------|------|
| **Google Search Console** | 키워드 순위, 인덱싱 오류 | 무료 |
| **Google Analytics 4** | 트래픽 분석 | 무료 |
| **네이버 서치어드바이저** | 네이버 인덱싱, 키워드 | 무료 |
| **Ahrefs / SEMrush** | 경쟁사 분석, 백링크 | 유료 (필요시) |
| **Vercel Analytics** | Core Web Vitals 실사용자 데이터 | 무료 tier |
| **Sentry** | 에러 추적 (페이지 크래시 = SEO 손해) | 무료 tier |

### 9-5. 자동화

| 도구 | 용도 | 추천도 |
|------|------|-------|
| **Google Trends API (unofficial)** | 트렌딩 키워드 감지 | ⭐⭐⭐ |
| **네이버 DataLab API** | 네이버 검색량 데이터 | ⭐⭐⭐ |
| **Cron (Vercel)** | 일별 운세 자동 생성 | ⭐⭐⭐ |

---

## 10. 네이버 SEO 전용 전략

### 10-1. 네이버 서치어드바이저

필수 등록. 구글 서치콘솔과 동급 중요도.

```
https://searchadvisor.naver.com/
1. 사이트 소유 확인 (메타태그 방식 권장)
2. 사이트맵 제출: https://yourdomain.com/sitemap.xml
3. RSS 피드 제출 (뉴스 사이트 필수): /rss.xml
```

### 10-2. 네이버 뉴스 제휴 (정치 사이트)

뉴스 사이트라면 네이버 뉴스 제휴는 검색 노출의 핵심. 제휴 없이는 뉴스 탭 진입 불가.

**네이버 뉴스 제휴 조건 (2026 기준):**
- 언론사 등록 or 인터넷신문 등록증 필요
- 6개월 이상 발행 이력
- 일정 기준 이상의 콘텐츠 수
- 독자적 취재·편집 능력 심사

**제휴 전 대안: 네이버 블로그 채널 운영**
- 공식 블로그에 기사 요약 + 원문 링크 게시 → 네이버 검색 유입 확보

### 10-3. 네이버 최적화 메타태그

```html
<!-- 네이버봇 전용 메타 -->
<meta name="Yeti" content="All" />
<meta name="NaverBot" content="All" />

<!-- OG 태그 (네이버도 읽음) -->
<meta property="og:type" content="article" />
<meta property="og:site_name" content="사이트명" />
```

### 10-4. robots.txt 네이버봇 전용 허용

```
User-agent: Yeti
Allow: /
Disallow:
```

(이미 위 robots.ts에 반영됨)

### 10-5. 네이버 키워드 특성

- 네이버는 콘텐츠 내 **키워드 밀도** 여전히 중시
- 본문 첫 100자 내 핵심 키워드 1~2회 자연스럽게 삽입
- 제목 앞부분에 핵심 키워드 배치 (구글과 동일하지만 네이버는 더 직접적)
- 모바일 스니펫 길이: 50자 이내 제목, 80자 이내 설명

---

## 11. 성과 측정

### 11-1. KPI 설정

**사주 사이트**
| 지표 | 3개월 목표 | 6개월 목표 |
|------|---------|---------|
| 구글 오가닉 클릭 | 5,000/월 | 20,000/월 |
| 네이버 유입 | 3,000/월 | 15,000/월 |
| 사주 계산 완료율 | 40% | 60% |
| 재방문율 | 20% | 35% |

**정치 사이트**
| 지표 | 3개월 목표 | 6개월 목표 |
|------|---------|---------|
| 오가닉 클릭 | 10,000/월 | 50,000/월 |
| 뉴스 색인 속도 | 24시간 내 | 4시간 내 |
| 기사 평균 체류 시간 | 1분 | 2분 |

### 11-2. 모니터링 대시보드

```typescript
// 매주 체크할 SEO 지표 자동 추출 스크립트 (의사코드)

// Google Search Console API
const gscMetrics = await fetchGSC({
  startDate: '7daysAgo',
  metrics: ['clicks', 'impressions', 'ctr', 'position'],
  dimensions: ['query', 'page'],
})

// Core Web Vitals (Vercel Analytics API)
const cwv = await fetchVercelAnalytics({
  metrics: ['lcp', 'inp', 'cls'],
})

// 순위 추적 (상위 20개 키워드)
const rankings = await checkRankings(TOP_KEYWORDS)
```

### 11-3. 즉시 해야 할 작업 순서 (Quick Wins)

```
Day 1 (1시간):
☐ Google Search Console 등록 + 사이트맵 제출
☐ 네이버 서치어드바이저 등록 + 사이트맵/RSS 제출
☐ robots.txt Yeti 허용 확인
☐ GA4 설치 확인

Week 1:
☐ 모든 페이지 title/description 고유하게 작성 (중복 없도록)
☐ 주요 페이지 JSON-LD 삽입 (Article, FAQPage, BreadcrumbList)
☐ Canonical URL 전체 점검
☐ Core Web Vitals 측정 (PageSpeed Insights)

Week 2-4:
☐ 토픽 클러스터 허브 페이지 완성
☐ 날짜별 운세 자동 생성 Cron 구현
☐ 동적 OG 이미지 생성 구현
☐ 내부 링크 체계 구축

Month 2-3:
☐ 백링크 확보 (관련 커뮤니티, 블로그 게스트 포스팅)
☐ 저자 E-E-A-T 강화 (소셜 프로필 연결)
☐ FAQ 섹션 추가로 People Also Ask 점령
☐ 구글 뉴스 등록 신청 (정치 사이트)
```

---

## 부록: 경쟁사 분석 대상

### 사주 니치 경쟁사
- 사주닷컴 (sajoo.com)
- 운세보기 (운세천문)
- 네이버 운세 탭 (직접 경쟁)
- 포털 운세 서비스들

### 정치 니치 경쟁사
- 한겨레, 조선일보, 중앙일보 (직접 경쟁 불가)
- 오마이뉴스, 프레시안 (틈새 공략 가능)
- 뉴스공장류 유튜브 연계 사이트

**경쟁 전략:** 대형 언론사와 정면 승부 대신,  
→ 사주: 개인화 도구 (생년월일 입력) + 짧은 콘텐츠로 롱테일 장악  
→ 정치: 여론조사 집계/시각화 데이터 허브로 포지셔닝 (기사보다 데이터)

---

*작성: 2026-06-08 | 적용 스택: Next.js 16 App Router + Vercel*
