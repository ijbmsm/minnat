Key Findings

행위자(actor) 추출은 LLM 단독으로는 한국어 정치 텍스트에서 일관성이 떨어진다 — "이재명이 막말 비판받았다"처럼 피동/사동/인용절이 섞이면 LLM이 actor와 patient를 혼동한다는 것이 학술 컨센서스(Pado et al., "Actor Identification in Discourse: A Challenge for LLMs?", arxiv:2402.00620). 해결책은 NER + Gazetteer + LLM의 결합이며, 한국어 SRL 데이터셋이 BigKinds 사회면 기사 기반으로 KCI에 공개되어 있다.
policy_win 같은 "성과" 판정은 LLM이 아니라 결정론적 규칙으로 처리해야 한다 — 국회 의안정보시스템 OpenAPI는 BILL_ID, PROC_RESULT_CD(가결/부결), PROC_DT를 제공한다. 공공데이터포털의 BillInfoService2 엔드포인트(개발계정 일 10,000건)는 무료다. 뉴스 기사에서 BILL_NO만 정규표현식으로 추출하면 LLM 없이 입법 상태를 거의 100% 정확히 알 수 있다.
SNU팩트체크는 2024년 8월 18일부로 무기한 중단됐다 — 한국기자협회 보도에 따르면 "2017년 3월29일 출범 이후 만 7년 4개월" 만이며, 약 5,000건의 검증문이 read-only로 보존된다. 네이버 연간 10억원 지원이 2023년 8월에 종료된 데 이어, 유럽기후재단(ECF) 등 해외공익재단의 지원도 2024년 8월 종료된 것이 직접 원인. JTBC는 2020년 2월 IFCN 최초 인증을 받았으나 2023년 만료된 뒤 갱신을 미루다가 2025년 4월 재인증을 받았고, IFCN 프로필에 "It is currently the only IFCN Signatory in the country"로 등재되어 있다. MBC 알고보니, KBS 팩트체크K, 연합뉴스 팩트체크, SBS 사실은, 노컷체크가 활성 상태이지만 한국 매체 중 ClaimReview schema.org JSON-LD를 발행하는 곳은 확인되지 않는다. Journalist + 6
빅카인즈 API는 self-service가 아니다 — 약관상 "무료 제공을 원칙으로 함"이지만 키 발급은 연 1회 뉴스빅데이터 해커톤(newsbigdata.kr) 또는 미디어 스타트업 지원사업(연 3,000만원 한도)을 통해서만 이뤄진다. 기사 본문 재배포는 저작권법으로 금지(footer: "전재, 복제, 배포하는 행위를 금합니다") 되어 있어 minnat-crawler는 메타데이터·점수만 노출 가능하다. Kinds + 3
곱셈식 점수 공식은 통계적으로 한 차원이 다른 차원을 압도한다 — 현재 e^(-0.01t)는 1년이면 0.026, 5년이면 1.2×10^(-8)로 사실상 소멸하므로 "기간별 뷰" 분리가 정답이다. Hacker News의 (P-1)/(T+2)^1.8은 hot 뷰에 적합하나, 정치 도메인의 역사적 무게는 무감쇠 + Bayesian shrinkage가 더 적합하다.
AllSides·Ad Fontes의 multi-partisan editorial process는 자동 분류 편향을 완화하는 가장 검증된 모델이다 — Ad Fontes의 백서(2025년 9월 갱신)에 따르면 좌·중·우 각 1명씩 3인 패널이 동일 콘텐츠를 평가하고 평균을 낸다. 자동 분류의 mean absolute error는 신뢰성·편향 두 축 모두 약 4점이며, 백서는 "MAE of 4 points to be quite accurate, given that the standard deviation between human analysts is approximately three points"라고 명시한다(스케일 -42~+42). Ad Fontes Media + 2
Chain-of-Verification은 환각을 정량적으로 줄인다 — Dhuliawala et al.(ACL 2024 Findings, arxiv:2309.11495)는 longform biography 생성 과제에서 LLaMA-65B + CoVe factor+revise 변형이 FACTSCORE를 55.9에서 71.4로 28% 향상시켰다고 보고한다. 정치 도메인의 자기검증 프롬프트 설계는 이 기법을 직접 차용할 수 있다.


(a) 분류·검증 로직 개선 — 최우선
A1. 행위자(actor) 추출: NER + Gazetteer + LLM CoT 3중 파이프라인 [Quick Win + 중기]
문제 진단: 현재는 LLM에게 자연어 지시만 의존한다. "이재명 대표가 막말 논란에 휩싸였다"에서 LLM은 행위 주체와 동작의 대상자를 분간해야 하지만 한국어 피동·사동·인용절에서 일관성이 떨어진다.
권고:

Step 0 (Quick Win, 1주): 정치인 DB를 21명에서 22대 국회의원 300명 + 정부 주요 직책자(대통령·총리·장관 ~50명) + 17~21대 전·현직 약 1,500명으로 확장. 국회 OpenAPI "국회의원 현황" 엔드포인트(open.assembly.go.kr/portal/openapi/main.do)에서 일괄 수집 가능. 출력값에 NAEMIN_CODE, POLY_NM(정당), HG_NM(한자명), ENG_NM, ELECT_DIV_NM(지역구/비례) 포함.
Step 1 (중기, 4~6주): KPF-BERT-NER(HuggingFace KPF/KPF-bert-ner, MIT 라이선스)을 LLM 앞단에 배치. BigKinds 7,800만 건 신문 기사로 사전학습된 KPF-BERT는 일반 KoBERT보다 뉴스 도메인에서 우위가 있고, 모델 카드는 "신문기사에 특화된 BERT 모델로 언론, 방송 매체에 강인한 모델"로 자평한다. 국립국어원 모두의 말뭉치 150태그 스킴(PS_NAME 인명, CV_POSITION 직위, OGG_POLITICS 정치조직)으로 fine-tune되어 있다. 유의: KPF는 공식 F1을 공개하지 않았고, 한국어 BERT NER의 일반 baseline F1은 약 0.84(NCBI PMC7526093 임상 NER 보고치)이므로 자체 벤치마킹이 필요하다. PS_NAME 결과를 위 gazetteer와 매칭해 "정치인 인명만" 필터링한다(정치인 vs 일반인 disambiguation은 모델 자체로는 안 됨). GitHub + 4
Step 2 (중기): LLM 프롬프트를 Chain-of-Thought + Chain-of-Verification(Dhuliawala et al. 2023) 구조로 재작성. 권장 템플릿:

[STEP 1] NER이 추출한 정치인 후보: {김건희, 이재명, 한동훈}
[STEP 2] 각 인물에 대해 답하라:
  (a) 이 인물이 직접 행한 동작이 있는가? (말했다/제출했다/투표했다 등)
  (b) 이 인물이 동작의 객체(대상)인가? (비판받았다/지적당했다/거론됐다)
  (c) (a)와 (b) 모두 해당되면 lead 문장의 주어를 우선시한다.
[STEP 3] 자기검증: "만약 이 인물이 행위자가 아니라면 누가 행위자인가?"를 다시 답하라.
  두 답이 다르면 confidence를 0.5 미만으로 낮춰라.
[STEP 4] 최종 actor를 선택하고 evidence 문장을 인용하라.
Dhuliawala et al.(arxiv:2309.11495, ACL 2024 Findings)의 보고에 따르면 longform biography 생성에서 CoVe factor+revise가 FACTSCORE를 55.9→71.4로 28% 향상시켰다. 정치 도메인 행위자 추출은 사실 기반 작업이므로 동일 기법이 직접 적용 가능하다.

Step 3 (장기): 한국어 SRL 모델(KCI 공개 BigKinds 사회면 SRL 데이터셋 기반)을 fine-tune하여 predicate-argument 구조에서 ARG0(agent)를 직접 추출. 학술적으로 가장 정확하지만 학습 비용이 크다.

구현 난이도: Step 0 = 1일, Step 1 = 2주, Step 2 = 1주, Step 3 = 1~2개월.
A2. policy_win 판정: 국회 OpenAPI 연동 결정론적 검증 [Quick Win]
문제 진단: LLM이 "공약 발표/제안"을 policy_win으로 오판한다. 한국 입법 절차는 발의 → 위원회 회부 → 위원회 심사 → 본회의 상정 → 표결 → 가결/부결 → 공포 → 시행의 다단계이고, 각 단계는 다른 가중치를 가져야 한다.
권고:

Quick Win (1주): 한국 입법 절차 키워드 사전을 5단계로 분리하고, 기존 단일 policy_win을 폐기·대체:

bill_proposed (발의/제안/발의안 제출) — 가중치 1
bill_committee_passed (위원회 통과/소위 가결) — 가중치 3
bill_plenary_passed (본회의 가결/통과) — 가중치 6
bill_promulgated (공포) — 가중치 8
bill_enforced (시행) — 가중치 10



pythonLEGISLATIVE_STAGE_KEYWORDS = {
    "bill_proposed": ["발의", "제안", "제출했다", "발의안", "법안 마련"],
    "bill_committee_passed": ["상임위 통과", "위원회 의결", "소위 가결", "법사위 통과"],
    "bill_plenary_passed": ["본회의 가결", "본회의 통과", "본회의 의결", "표결로 통과", "재석 의원 ~ 찬성"],
    "bill_promulgated": ["공포", "관보 게재", "법률 제~호"],
    "bill_enforced": ["시행", "발효", "효력 발생", "오늘부터 시행"],
}

중기 (3~4주): 국회 의안정보시스템 OpenAPI(open.assembly.go.kr) 또는 공공데이터포털 BillInfoService2(apis.data.go.kr/9710000/BillInfoService2, 개발계정 일 10,000건)를 cron으로 매일 동기화. 기사에서 BILL_NO를 정규표현식(예: 7자리 의안번호)으로 추출하고 PROC_RESULT_CD와 PROC_DT를 가져와 결정론적으로 단계를 결정. 이 경우 LLM 의존도가 사실상 0이 된다.
국회 OpenAPI 핵심 엔드포인트 (velog.io/@assembly101 검토 기준):

nzmimeepazxkubdpn — 국회의원 발의법률안 (대표발의자/공동발의자 구분)
의안정보통합 API — 모든 의안 통합 조회
국회의원 본회의 표결정보 — 표결 자동화 핵심



구현 난이도: Quick Win = 3일, 중기 = 3주.
A3. 2차 검증 룰 강화: ML/LLM ensemble [중기]
권고:

Quick Win: validator에 "uncertainty" 모드. 키워드 미매칭 시 reject가 아니라 queue_review.
중기: 다중 LLM ensemble. Claude Haiku + GPT-4o-mini에 동시 분류시키고 두 결과 일치 시에만 자동 점수 반영. Cruickshank & Ng(2023)는 LLM의 분류 일관성이 낮다고 지적하므로 self-consistency(같은 모델 5번 호출 후 다수결)도 비용이 낮은 대안이다.
중기: confidence calibration. arxiv:2506.03723("Verbalized Confidence Triggers Self-Verification")에 따라 LLM이 신뢰도를 직접 출력하게 하고 0.7 미만은 human review queue로.

구현 난이도: Quick Win = 2일, 중기 = 2주.
A4. 편향 자동 감사 — Mirror Test [중기]
권고:

Quick Win (1주): 매주 cron job:

sqlSELECT category, camp, AVG(score), COUNT(*), STDDEV(score)
FROM issues
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY category, camp;
Welch's t-test(p<0.05)로 진영별 평균 차이가 우연이 아닐 확률이 있으면 자동 알람.

중기: Manhattan Institute(2024) partisan bigram 방법론 응용. 한국어 정치 편향 키워드 사전을 학술 데이터(arxiv:2311.01712 KoPolitic Benchmark 12,000건)에서 구축. AllSides 매체 분류와 partisan bigram frequency의 Pearson r=0.80 상관관계가 검증돼 있다. Manhattan Institute
중기: "Counterfactual Mirror Test". 동일 사건의 행위자만 진영 swap한 합성 케이스를 GPT로 생성, 분류기 출력이 동일한지 확인. Ziems et al.(2023) 편향 측정 기법.

구현 난이도: Quick Win = 3일, 중기 = 3주.
A5. 프롬프트 엔지니어링 — 행위자/대상 혼동 방지 [Quick Win]
즉시 적용 권고 템플릿:
당신은 한국 정치 기사 분류 분석가입니다.

규칙 1 (행위자 vs 대상): "X가 비판받았다"에서 행위자는 비판한 주체이지 X가 아니다.
  - "이재명, 막말 논란" → actor=이재명 (이재명이 막말을 했음)
  - "이재명, 막말 비판받아" → actor=이재명 (행위 주체)
  - "이재명을 비판한 여당 대변인" → actor=여당 대변인
  - 헷갈리면 lead 문장의 동사를 찾고 그 동사의 주어를 추출.

규칙 2 (행위 vs 성과): 다음은 성과가 아니다:
  발의/제안/제출/추진/계획/발표/약속/공약
  다음만 성과로 인정:
  본회의 가결/본회의 통과/공포/시행/효력 발생

규칙 3 (자기검증): 출력 전에 답하라:
  Q1: actor의 진영을 반대로 바꾸면 같은 카테고리·점수가 나오는가?
  Q2: actor 자리에 다른 사람(비판한 사람 등)을 넣으면 같은 결과가 나오는가?
  하나라도 "아니오"면 confidence를 0.6 이하로.

규칙 4 (출력): JSON으로, evidence_sentence 필수.
Wei et al.(2022) CoT + Dhuliawala et al.(2024) CoVe + OpenAI cookbook explicit-rules의 결합.

(c) 소스 수집·교차검증 인프라 — 두 번째 우선
C1. 한국 언론사 데이터 수집 — RSS의 현실과 우회 [Quick Win + 중기]
문제 진단:

MBC: 기존 imnews.imbc.com/rss/*.xml 피드는 일부 카테고리만 유지되고 정치 피드는 비활성화.
KBS: 공식 RSS 페이지가 사라졌고 현재는 news.kbs.co.kr 카테고리 페이지 HTML 파싱이 필요.
연합뉴스: 자체 유료 API(BTS for Yonhap) 외에는 RSS를 공식 제공하지 않음. yna.co.kr/RSS/* 일부만 살아 있음.

Quick Win (2주):

akngs/knews-rss 오픈소스 저장소(GitHub)에서 publishers.csv와 feed_specs.csv 활용. 커뮤니티 PR 유지보수.
네이버 검색 API (openapi.naver.com/v1/search/news.json) — Client ID/Secret 무료 발급, 일 25,000건 query. 정치인 이름·키워드로 polling, 응답에 link, originallink, pubDate 포함. 본문은 link로 크롤링.
공공데이터포털 BigKinds 메타데이터 파일 — 한국언론진흥재단_뉴스빅데이터_고빈도사용명사_정치면 등 월별 CSV 무료. 104개 신문·방송사 정치면 분석 데이터.

중기 (1~3개월):

빅카인즈 해커톤 API(newsbigdata.kr, 연 1회) 또는 미디어 스타트업 지원사업(연 3,000만원 한도). 본문 재배포는 저작권법으로 금지, 메타데이터·점수만 노출. NewsbigdataBigkinds
KPF-BERT-NER + KPF-BERT-CLS 자체 호스팅: BIGKINDS-LAB GitHub(KPF-bigkinds/BIGKINDS-LAB) MIT 라이선스. 단 api.bigkindslab.or.kr:5002 엔드포인트는 외부 호출 불가, 모델 다운로드 후 자체 호스팅 필요. githubgithub

중장기:

GDELT Project Korean feed(15분 단위, 무료) — metadata 활용.
NewsAPI(newsapi.org) 일부 한국 매체 커버, 유료.

구현 난이도: Quick Win = 2주, 중기 = 1~3개월(해커톤 일정 의존).
C2. 공공 데이터 Tier 1 자료원 확장 [Quick Win]
자료원URL활용국회 의안정보시스템 OpenAPIopen.assembly.go.kr/portal/openapi/main.do법안 단계, 표결, 발의자국회 본회의 표결정보 API(위 포털)의원별 찬반 — 스코어카드 핵심국회 의원현황 API(위 포털)300명 정치인 DB 자동 동기화공공데이터포털 BillInfoService2apis.data.go.kr/9710000/BillInfoService2의안 상세, 심사경과 (개발계정 일 10,000건)법제처 국가법령정보센터law.go.kr/DRF/lawService.do공포·시행 날짜중앙선관위 정보공개nec.go.kr선거·후보·득표대법원 사법정보공개포털scourt.go.kr정치인 형사사건
모두 Tier 1(국가기관 1차 자료)이며 단일 출처만으로 즉시 점수 반영 정당화.
C3. 한국 팩트체크 자원 재구성 [중기]
현실 진단: SNU팩트체크는 7년 4개월 만인 2024년 8월 18일 무기한 휴지(약 5,000건 read-only 보존). 뉴스톱은 2024년 경제지로 매각·전환. 한국에서 유일한 IFCN Signatory는 JTBC(2025년 4월 재인증, IFCN 프로필 명시). OhmyNews + 3
Tier 2 격상 매체 권고:

JTBC 팩트체크부: IFCN 인증, 보도국장 직속 6인 팀(오이석 부장 + 3 기자 + 2 리서처 + 1 PD), 내부 "레드팀" 검증. 단일 출처여도 Tier 2 인정 가능. URL: jtbc.co.kr 팩트체크. DanbinewsDanbinews
MBC 알고보니 (※사용자 표기 "잠금해제"는 현재 브랜드와 불일치, 확인 권고): imnews.imbc.com/newszoomin/turnedout/. 2025년 12월~2026년 1월 정기 발행 확인.
KBS 팩트체크K: news.kbs.co.kr. 정기 발행.
연합뉴스 팩트체크, SBS 사실은, 노컷뉴스 노컷체크, 오마이뉴스 오마이팩트: Daum 뉴스 팩트체크 aggregator에 활성 매체로 집계. Daum

SNU팩트체크 read-only DB 활용: 1회성 스크래핑으로 2017~2024 역사 데이터 확보 가능. minnat-crawler의 "역사 데이터 미수집" 한계에 직접 기여.
ClaimReview 발행 — 한국 최초 표준 호환: 한국 매체 중 ClaimReview schema.org JSON-LD를 발행하는 곳은 확인되지 않는다. minnat-crawler가 자체 발행하면 Google Fact Check Tools API에 자동 등록되고 한국에서 사실상 최초의 표준 호환 팩트체크 신호 발신자가 된다. 다만 Google 정책은 "정치 캠페인·정당 운영 사이트는 자격 없음"이므로 중립 비영리 자리매김이 필수.
구현 난이도: Tier 2 격상 = 1주, SNU 역사 스크래핑 = 1~2주, ClaimReview 발행 = 2주.
C4. 교차검증 알고리즘 고도화 [중기]
문제 진단: "Tier 3 매체 2개 이상 → verified"는 동일 통신사(연합뉴스) 기사를 KBS·MBC가 그대로 재인용해도 "2개"로 카운트한다.
권고:

Quick Win: 매체 정치 성향 다양성 가중치.

진보: 한겨레, 경향신문, 오마이뉴스
중도: KBS, MBC, SBS, 연합뉴스
보수: 조선일보, 중앙일보, 동아일보, 채널A, TV조선
좌·우가 모두 보도하면 verified, 같은 성향만이면 unverified.


중기: 통신사 원문 식별. "연합뉴스 제공"·"공동취재단" byline 패턴 + 본문 임베딩 유사도(SBERT 또는 ko-sroberta-multitask) 0.85 이상이면 "동일 출처 재인용"으로 1건 카운트. arxiv
중기: 보도 시점 차이. 통신사 첫 보도 후 1시간 이내 동일 사실 = 재인용 가능성 높음. 12시간+ 차이 + 매체 다양성 + 추가 사실 = 독립 보도.
장기: MinHash + LSH로 24시간 윈도우 내 O(N) 중복 클러스터링(CrackingWalnuts 시스템 디자인 참조).

구현 난이도: Quick Win = 3일, 중기 = 1~2개월, 장기 = 3개월+.
C5. 신뢰도 점수화 — 국제 사례 차용 [중기]

AllSides 5단계(Left, Lean Left, Center, Lean Right, Right) + Blind Bias Survey. 한국 적용 시 언론진흥재단 언론수용자 조사에서 매체별 신뢰도(1~10점)가 연간 공개되므로 초기 매핑 가능. AllSides
Ad Fontes 2축 모델(편향 -42~+42 × 신뢰도 0~64). 좌·중·우 3인 패널이 평균. 자동 분류 MAE 약 4점, 인간 분석가 표준편차도 약 3점. 한국 적용은 분기별 spot-check에 현실적. Ad Fontes Media
NewsGuard 9개 기준 100점: 거짓 정보 반복 게재, 책임 있는 정정, 명확한 광고 표시 등. 한국 적용 가능.

C6. 글로벌 표준 채택 [Quick Win]

ClaimReview JSON-LD: 위 C3 참조.
GDELT Event Database: 분 단위 글로벌 이벤트 DB, 한국어 포함, 무료.


(b) 점수 공식 재설계 — 세 번째 우선
B1. 시간 감쇠 — 기간별 뷰 함수 분리 [중기]
문제 진단: 현재 e^(-0.01t)는 100일에 0.37, 365일에 0.026, 1,825일(5년)에 1.2×10^(-8)로 사실상 소멸.
권고:
뷰감쇠 함수근거최근 30일 (Hot)score / (T_hours + 2)^1.8Hacker News 검증 공식. 최신성·변동성 강조1년 (Recent)score × e^(-0.005t)반감기 약 140일5년 (Mid-term)score × max(0.3, e^(-0.002t))30% floor — 역사적 사건 보존역대 (All-time)score × 1 + Bayesian shrinkage무감쇠
Bayesian shrinkage: (score_sum + C × global_mean) / (count + C), C=10~20. 신인 정치인의 표본 수 부족 변동성 평탄화. Reddit best comment sorting의 Wilson score interval과 동일 정신.
pythonimport math
def view_score(raw_score, age_days, view="recent"):
    if view == "hot":
        return raw_score / pow(age_days * 24 + 2, 1.8)
    if view == "recent":
        return raw_score * math.exp(-0.005 * age_days)
    if view == "midterm":
        return raw_score * max(0.3, math.exp(-0.002 * age_days))
    return raw_score  # all_time
구현 난이도: 1~2주.
B2. 다차원 점수 정규화 — 곱셈에서 가중 log합으로 [중기]
문제 진단: 카테고리(4~10) × 시간감쇠(0~1) × 심각도(1~3) × 영향범위(0.5~1.2)는 (1) 한 차원 0이면 catastrophic vanishing, (2) trade-off 비선형 비해석, (3) 분산 폭증.
권고 — Additive log score:
final_score = w1*log(category) + w2*log(severity) + w3*log(scope) + log(time_decay)
선형 분리, 한 차원 작아도 나머지 보완, 가중치 조정으로 정책적 우선순위 표현.
또는 min-max 후 가중 합:
final_score = 0.4*norm(category) + 0.3*norm(severity) + 0.2*norm(scope) + 0.1*norm(time)
시그모이드 squashing: 최종 0~100. 100 / (1 + exp(-k(x - x_0))). UI 친화적.
구현 난이도: 1주 (A/B 테스트로 기존 분포 비교 필요).
B3. 진영 비교 공정성 — Dual Metric [Quick Win]
문제 진단: 22대 국회 더불어민주당은 지역구 161석 + 비례 14석(더불어민주연합) = 175석으로 단독 과반, 국민의힘은 지역구 90석 + 비례 18석(국민의미래) = 108석(위키백과 「대한민국 제22대 국회」, YTN 2024.04.11). "총합" 비교는 다수당이 구조적으로 불리하다.
권고:

항상 두 지표 병기:

진영 총합 점수 (현행)
1인당 평균 점수 (= 총합 / 인원)


이슈 다양성: 진영별 unique 이슈 수. 한 명이 큰 사건 하나로 점수 독차지 방지.
백분위 정규화: 개인 점수를 진영 내 백분위로 노출. "민주당 내 상위 10%".
이슈 빈도 보정: 카테고리별 평균 점수 공시. 예: "막말 카테고리 blue 평균 4.2 vs red 평균 4.5".

Per-capita 함정: 군소정당(정의당·진보당·개혁신당·기본소득당)에서 한 명의 이슈가 평균을 좌우. 군소정당은 별도 섹션, 양당만 직접 비교 권장.
구현 난이도: 1주.
B4. 정치인 스코어카드 설계 [중기]
국제 사례:

GovTrack: ideology score(co-sponsorship 기반 PageRank) + leadership score(법안 통과 능력). 한국 의안정보 API로 동일 적용 가능.
VoteSmart: 1,500+ 이익단체 평가 + Political Courage Test.
TheyWorkForYou (UK): 출석·발언·표결·지역구 활동.
참여연대 "열려라 국회": 17대부터 누적 DB, 본회의·상임위 출석 + 의안별 찬반.

한국 적용 권고:

기본 정보(소속, 지역구/비례, 임기, 선수)
의정 통계(출석률, 발의, 가결률, 표결 참여) — 국회 OpenAPI 자동
minnat-crawler 점수(카테고리별 breakdown, 시계열)
주요 이슈 5건(점수순) + 검증 상태
평가 노트: 출처 link-out

시계열 뷰: 30일/1년/5년/역대 4탭.
비례·지역구 구분: 지역구는 지역 현안 발언 가중치, 비례는 정책 전문성 가중치.
직책별 가중치(영향범위):

대통령: 1.2 (max)
총리·당대표·원내대표: 1.0
장관·국회의원: 0.8
후보·당직자: 0.5

구현 난이도: 4~6주.
B5. "논란 정책" 카테고리 점수 미반영 — 검토 [중기]
학술 분류:

Empirical claim(사실): "OO법이 통과됐다" — 점수 반영
Contested fact(논쟁적 사실): "OO법으로 집값이 ~% 올랐다" — 인과 학계 합의 부족 → 미반영
Normative claim(규범): "OO법은 정의롭다/부정의하다" — 미반영
Predictive claim(예측): "OO하면 ~할 것이다" — 미반영, 사후 검증 가능

권고:

NLP 분리: 사실/의견 분류기 별도 학습. arxiv:2311.01712 KoPolitic Benchmark 12,000건(5단계 정치성향 + 6단계 친정부) 활용.
거버넌스: "논란 정책" 판정을 자문위(다당적·학술적 3~5인)가 결정. 사유 공개.
분리 룰: 통계 일치 또는 학회 다수 의견(피인용 논문 3편+) → 사실; 그 외 → contested 표시 + UI에 양측 주장 병기(Tangle News 스타일).

구현 난이도: 4~8주.

편향 방지 방법론 (모든 영역 통합)
D1. 정량적 자동 감사
Quick Win — 주간 편향 감사 리포트:

카테고리 × 진영 점수 분포(mean, median, p90, std)
Welch's t-test p값
카테고리별 카운트 차이(sampling bias 지표)
매체별 분류 분포(분류기 편향 지표)

중기 — Mirror Test 자동화: 진영 swap 합성 케이스 cron 생성·테스트, 출력 불일치 시 알람.
D2. 방법론 공개와 Gaming 대응
원칙: 가중치·키워드 사전·검증 룰 전부 공개.
Gaming 대응:

다중 신호 결합: 본회의 통과는 BILL_NO 매칭 + 다중 매체 보도 + 국회 API 3중 확인.
이상치 모니터링: 단기 점수 급변 자동 감지, Wilson score interval confidence bound.
Adversarial testing: "이 정치인을 일부러 ~점수로 만들려면?" 시뮬레이션. 룰 수정.
버전 관리: 가중치·룰 변경 Git 기록 + 사유 공개. AllSides "Methodology Updates" 페이지 벤치마크.

D3. 학술 기반 편향 측정

Manhattan Institute partisan bigram(2024): 좌·우 매체 과사용 어휘 추출, minnat-crawler 출력 frequency 측정. AllSides 매체 분류와 Pearson r=0.80 검증.
arxiv:2311.01712 KoPolitic Benchmark: 12,000건 한국어 정치 뉴스, 분류기 partisan bias 측정 표준.
WEFE/StereoSet: NLP 임베딩 편향. 한국어 직접 적용 데이터 부족하나 KoBERT/KLUE-BERT 정치인 임베딩이 좌-우 축으로 클러스터링되는지 확인 가능.

D4. "논란 정책" 거버넌스

자문위 5인: 좌·중·우 학계 1명씩 + 시민단체 1명 + 운영자 1명. 합의제 또는 4/5 다수결.
분기별 점검: 분류 결정·사유 공개.
사용자 이의 제기: GitHub Issue로 누구나, 자문위 검토.

D5. 국제 사례의 한국 적용 가능성
모델핵심한국 적용AllSides Editorial Review좌·중·우 패널 토론 후 합의자문위 가능. Blind Bias Survey는 시민 패널 비용 큼Ad Fontes Multi-analyst3인 패널 독립 평가 평균분기별 spot-check 가능Tangle News 양측 병기좌·우 매체 주장 같이 표시UI contested 이슈 적용 ★ 강력 권고AllSides Headline Roundups같은 사건 좌·중·우 헤드라인 병치이슈 상세 페이지 적용 가능
한국 특수성:

양당+군소정당: 정의당·진보당·개혁신당·기본소득당은 진영 단순 매핑 어려움. blue/red 외에 third_camp_progressive, third_camp_conservative, independent 추가 권고.
비례·지역구: 활동 패턴 다름, 별도 보정.
직책별 가중치: B4 참조.
계엄·탄핵 같은 헌정 사건: 영향범위 1.2 cap 일시 해제 또는 별도 카테고리(constitutional_crisis) 격리.


Recommendations — 우선순위와 단계
Phase 1 (1~2주, Quick Wins)

정치인 DB 확장: 국회 OpenAPI로 22대 의원 300명 + 정부 직책자 동기화 (21명 → ~400명).
policy_win 5단계 분해: bill_proposed → bill_enforced. 키워드 사전 즉시 적용.
프롬프트 재작성: 행위자/대상 규칙, 자기검증, JSON 형식(A5 템플릿).
편향 자동 감사 SQL: 주간 cron.
MBC 알고보니, JTBC 팩트체크, KBS 팩트체크K Tier 2 격상.
akngs/knews-rss + 네이버 검색 API로 매체 수집 확대.
Dual Metric: 진영 총합 + 1인당 평균 병기.

Phase 2 (1~3개월, 중기)

KPF-BERT-NER 통합: HuggingFace 자체 호스팅, NER → gazetteer → LLM 파이프라인.
국회 의안정보 API 결정론적 매칭: BILL_NO 자동 추출 + PROC_RESULT_CD. policy_win LLM 의존도 0.
다중 LLM ensemble: Claude + GPT 일치 시에만 자동 점수.
시간 감쇠 함수 뷰별 분리: 30일/1년/5년/역대 4탭.
곱셈식 → log-additive 또는 가중 합.
SNU팩트체크 역사 DB 스크래핑: 5,000건 확보(1999~2024 갭 일부 보완).
ClaimReview JSON-LD 자체 발행: 한국 최초 표준 호환.
빅카인즈 해커톤·미디어 스타트업 지원 신청: API 접근권.

Phase 3 (3~6개월, 장기)

한국어 SRL fine-tune: BigKinds SRL 데이터셋 기반, ARG0 직접 추출.
MinHash + LSH 중복 클러스터링: O(N) 효율 매체 다양성 측정.
자문위 거버넌스 출범: 다당적·학술적 5인, 분기별 점검.
정치인 스코어카드 v1: GovTrack 이념점수 + 한국 의정 통계.
Mirror Test 자동화: 합성 케이스 + 분류기 일관성 측정.

임계값 — 어느 신호가 보이면 권고가 바뀌는가

빅카인즈 API 자체 발급 자동화(2026년 이후 가능성): Phase 1의 매체 확대 우선순위가 빅카인즈 단독으로 전환.
SNU팩트체크 재개: Tier 2 격상 매체 목록 재조정.
사용자 트래픽 일 1만 이상: 자문위 거버넌스 우선순위 상향(외부 압력 대비).
분류 정확도 90% 미만 측정: Phase 3 SRL fine-tune을 Phase 2로 끌어올림.


Caveats

빅카인즈 API의 자유 접근 불가능성: 단기에 풍부한 매체 데이터 확보가 어려움. 해커톤·지원사업 신청이 사실상 필수.
KPF-BERT-NER의 공식 F1 미공개: 한국 정치인 인명 인식 정확도는 자체 측정 필요. 학술 baseline은 일반 한국어 NER에서 micro-F1 약 0.84(NCBI PMC7526093).
SNU팩트체크 재개 가능성은 낮다: 정치 압박 지속 한 민간 재원만으로는 운영 어려움이 학계 컨센서스. minnat-crawler는 외부 팩트체크 의존을 줄이고 자체 검증을 강화해야 함. Snunews
ClaimReview 발행의 정치적 리스크: Google Fact Check Tools 정책은 "정치 캠페인·정당·당선자 운영 사이트 자격 없음" 명시. 중립 비영리 자리매김이 자격 유지 조건. Google
AllSides·Ad Fontes의 multi-partisan editorial은 사람이 본다: 자동화 한계. minnat-crawler는 알고리즘 + spot-check 인간 검토 hybrid가 현실적.
MBC "잠금해제" vs "알고보니": 사용자 언급 "잠금해제"는 현재 브랜드와 불일치, 현행 MBC 팩트체크 세그먼트는 "알고보니"임을 확인 권고.
시간 감쇠 뷰별 분리 시 점수 의미가 뷰마다 달라짐: 사용자 교육(UI 툴팁, 방법론 문서) 필수.
편향 감사가 편향 자체를 정량화한다는 한계: "동일 행위 동일 점수"가 가능한지 자체가 가치판단 포함. 100% 객관적 감사는 불가능, 투명성·검증 가능성이 차선책.
모든 점수의 공시는 정치적 영향력 행사가 될 수 있음: 선거 직전 점수 발표 freeze, 점수 변동 사유의 동시 공시 같은 운영 원칙 미리 합의 권고.
