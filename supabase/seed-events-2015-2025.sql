-- ============================================================
-- 2015–2025 주요 사건 시드 데이터 (보강)
-- seed-historical-events.sql 실행 이후 실행
-- ============================================================

DO $$
DECLARE
  v_issue_id    UUID;
  v_cluster_id  UUID;
BEGIN

  -- ════════════════════════════════════════════
  -- 1. 이재명 — 성남 대장동 개발 특혜·배임 기소
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이재명 대장동 개발 특혜 배임 혐의 기소',
    '성남시장 재임 시 대장동 도시개발사업에서 민간 업자에게 과도한 이익(수천억원)을 몰아준 배임 혐의. 2022년 기소, 1심 재판 진행 중.',
    'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '검찰·법원',
    35.0, '2022-09-28', true, 'high', 'indicted',
    100, 500, false, 1.2,
    '이재명', '더불어민주당',
    '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"중앙일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"},{"name":"경향신문","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '이재명', 'criminal_conviction', 'blue',
      1, 100, 500, 1.3,
      'high', true, 35.0,
      '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2021-09-01', '2025-05-25', 'indicted', 1.2,
      1, '대장동 개발 특혜 배임 기소, 1심 재판 진행 중', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 2. 이재명 — 공직선거법 위반 (허위사실 공표)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이재명 공직선거법 위반 1심 유죄 — 의원직 상실 위기',
    '2022년 대선 당시 성남FC 후원금·법인카드 사용 관련 허위사실 공표 혐의. 2024년 11월 1심 유죄 선고(벌금 150만원, 의원직 상실형). 항소심 진행 중.',
    'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '법원',
    30.0, '2024-11-15', true, 'high', 'guilty_1st',
    100, 200, false, 1.2,
    '이재명', '더불어민주당',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '이재명', 'criminal_conviction', 'blue',
      1, 100, 200, 1.3,
      'high', true, 30.0,
      '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2023-05-01', '2025-05-25', 'guilty_1st', 1.2,
      1, '공직선거법 위반(허위사실 공표) 1심 유죄 벌금 150만원, 항소심 진행 중', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 3. 이재명 — 위증교사·제3자 뇌물 혐의 기소
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이재명 위증교사·쌍방울 제3자 뇌물 혐의 기소',
    '경기도지사 시절 쌍방울그룹 북측 대납 관련 제3자 뇌물수수, 대장동 재판 관련 증인 위증교사 혐의. 별도 재판 진행 중.',
    'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '검찰·법원',
    25.0, '2023-05-10', true, 'high', 'indicted',
    80, 300, false, 1.2,
    '이재명', '더불어민주당',
    '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"경향신문","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '이재명', 'criminal_conviction', 'blue',
      1, 80, 300, 1.3,
      'high', true, 25.0,
      '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"경향신문","lean":"progressive"}]',
      '2023-05-10', '2025-05-25', 'indicted', 1.2,
      1, '쌍방울 제3자 뇌물·위증교사 기소, 재판 진행 중', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 4. 조국 — 자녀 입시비리·사모펀드 대법원 확정
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '조국 자녀 입시비리·사모펀드 대법원 유죄 확정',
    '법무부장관 재직 시 자녀 대학 입시 관련 표창장 위조·인턴 확인서 허위 발급, 사모펀드 투자 관련 업무상 배임. 대법원 징역 2년 확정(2024년 1월). 2024년 1월 수감.',
    'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '대법원',
    38.0, '2024-01-25', true, 'high', 'confirmed',
    100, 365, false, 1.0,
    '조국', '조국혁신당',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"중앙일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '조국', 'criminal_conviction', 'blue',
      1, 100, 365, 1.3,
      'high', true, 38.0,
      '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2019-08-09', '2024-01-25', 'confirmed', 1.0,
      1, '자녀 입시비리·사모펀드 대법원 유죄 확정 징역 2년', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 5. 김건희 — 도이치모터스 주가조작 기소
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '김건희 도이치모터스 주가조작·명품백 수수 기소',
    '대통령 영부인 김건희, 도이치모터스 주가조작 공모 혐의 및 최재영 목사 명품백(디올백) 수수 혐의로 기소. 재판 진행 중.',
    'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '검찰·법원',
    35.0, '2025-01-06', true, 'high', 'indicted',
    100, 300, false, 1.2,
    '윤석열', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '윤석열', 'criminal_conviction', 'red',
      1, 100, 300, 1.3,
      'high', true, 35.0,
      '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2023-11-01', '2025-05-25', 'indicted', 1.2,
      1, '영부인 김건희 도이치모터스 주가조작·디올백 수수 기소', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 6. 개성공단 폐쇄 (2016)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '박근혜 정부 개성공단 전면 가동 중단',
    '2016년 2월 북한 4차 핵실험·장거리 미사일 발사 대응으로 개성공단 전면 가동 중단 결정. 124개 입주기업 철수. 남북 경제 협력 사실상 중단.',
    'official_misconduct', 'red', 1, 'https://www.unikorea.go.kr', '통일부',
    15.0, '2016-02-10', true, 'high', NULL,
    80, 90, false, 1.2,
    '박근혜', '새누리당',
    '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '박근혜', 'official_misconduct', 'red',
      1, 80, 90, 1.3,
      'high', true, 15.0,
      '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2016-02-10', '2016-05-01', NULL, 1.2,
      1, '개성공단 전면 가동 중단 결정, 124개 입주기업 철수', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 7. 문화예술계 블랙리스트 (2015-2016)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '박근혜 정부 문화예술계 블랙리스트 사건',
    '청와대·문화체육관광부가 정권에 비판적인 문화예술인 9,473명의 블랙리스트를 작성하고 정부 지원을 배제. 김기춘 비서실장·조윤선 장관 등 직권남용 유죄.',
    'official_misconduct', 'red', 1, 'https://www.law.go.kr', '법원·특검',
    25.0, '2016-10-12', true, 'high', 'confirmed',
    90, 300, false, 1.2,
    '박근혜', '새누리당',
    '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"한겨레","lean":"progressive"},{"name":"경향신문","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '박근혜', 'official_misconduct', 'red',
      1, 90, 300, 1.3,
      'high', true, 25.0,
      '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"한겨레","lean":"progressive"}]',
      '2015-01-01', '2018-07-19', 'confirmed', 1.2,
      1, '문화예술계 블랙리스트 9,473명 작성·지원 배제, 관련자 유죄', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 8. 드루킹 댓글 조작 사건 (2018)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '드루킹 댓글 조작 사건 — 김경수 경남지사 대법원 유죄',
    '블로거 드루킹(김동원)이 매크로 프로그램으로 포털 사이트 댓글 여론을 조작한 사건. 김경수 경남지사가 공모한 혐의로 대법원 징역 2년 확정(2021년 7월). 특검 수사.',
    'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '대법원·특검',
    30.0, '2021-07-21', true, 'high', 'confirmed',
    90, 365, false, 0.8,
    '김경수', '더불어민주당',
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '김경수', 'criminal_conviction', 'blue',
      1, 90, 365, 1.3,
      'high', true, 30.0,
      '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2018-04-14', '2021-07-21', 'confirmed', 0.8,
      1, '드루킹 댓글 조작 공모 대법원 유죄 확정 징역 2년', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 9. 이태원 참사 (2022)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이태원 참사 — 159명 사망, 이상민 행안부장관 탄핵소추',
    '2022년 10월 29일 이태원 핼러윈 인파 압사로 159명 사망. 정부 초동 대응 부재·안전 관리 부실 논란. 이상민 행안부장관 국회 탄핵소추(헌재 기각). 특별법 제정 갈등.',
    'official_misconduct', 'red', 1, 'https://www.assembly.go.kr', '국회·경찰청',
    30.0, '2022-10-29', true, 'high', NULL,
    100, 365, false, 1.2,
    '윤석열', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '윤석열', 'official_misconduct', 'red',
      1, 100, 365, 1.3,
      'high', true, 30.0,
      '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2022-10-29', '2023-10-29', NULL, 1.2,
      1, '이태원 참사 159명 사망, 정부 대응 부재, 행안부장관 탄핵소추(기각)', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 10. 해병대 채상병 순직 사건 — 수사 외압 (2023)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '해병대 채상병 순직 사건 — 수사 외압·임성근 구명 논란',
    '2023년 7월 해병대 일병 채모씨 수해 복구 중 순직. 임성근 해병대 사단장 업무상과실치사 수사 중 대통령실·국방부의 수사 외압 의혹. 이종섭 국방장관 사퇴 후 주호주대사 임명 논란. 공수처 수사.',
    'official_misconduct', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스·공수처',
    25.0, '2023-07-19', true, 'high', 'investigation',
    90, 300, false, 1.2,
    '윤석열', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '윤석열', 'official_misconduct', 'red',
      1, 90, 300, 1.3,
      'high', true, 25.0,
      '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2023-07-19', '2025-05-25', 'investigation', 1.2,
      2, '해병대 채상병 순직 수사 외압·임성근 구명·이종섭 출국 논란', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 11. 의대 정원 2000명 증원 — 의사 집단행동 (2024)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '의대 정원 2000명 증원 강행 — 전공의 집단 사직',
    '2024년 2월 정부 의대 정원 2000명 증원 결정. 전공의 약 1.2만 명 집단 사직, 수련병원 의료 공백 심화. 의료계 반발 장기화, 비상진료체계 가동. 정부·의료계 갈등 미해결.',
    'official_misconduct', 'red', 1, 'https://www.mohw.go.kr', '보건복지부',
    20.0, '2024-02-06', true, 'high', NULL,
    100, 365, false, 1.2,
    '윤석열', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"동아일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '윤석열', 'official_misconduct', 'red',
      1, 100, 365, 1.3,
      'high', true, 20.0,
      '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2024-02-06', '2025-05-25', NULL, 1.2,
      1, '의대 정원 2000명 증원 강행, 전공의 1.2만 명 집단 사직, 의료 공백', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 12. 검수완박 (검찰 수사권 완전 박탈) 법안 통과 (2022)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '검수완박 법안 국회 통과 — 검찰 수사권 대폭 축소',
    '더불어민주당 주도로 검찰의 직접 수사 범위를 부패·경제 범죄 6개로 대폭 축소하는 형사소송법·검찰청법 개정안 국회 통과(2022년 4월). 대통령 재의요구권 행사 불발, 5월 시행.',
    'policy_record', 'blue', 1, 'https://www.assembly.go.kr', '국회',
    0, '2022-04-30', true, 'high', NULL,
    80, 60, true, 1.0,
    '박찬대', '더불어민주당',
    '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '박찬대', 'policy_record', 'blue',
      1, 80, 60, 1.3,
      'high', true, 0,
      '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2022-04-01', '2022-05-30', NULL, 1.0,
      1, '검수완박 법안 국회 통과, 검찰 직접수사 6개 범죄로 축소', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 13. 정청래 — 국회 사법위원장 방탄 논란 (2024)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '정청래 사법위원장 — 이재명 방탄 국회 논란',
    '국회 법제사법위원장으로서 이재명 대표 관련 체포동의안·법안 처리 과정에서 방탄 논란. 야당 대표 사법리스크 관련 입법 지연·의사진행 방해 의혹으로 여야 갈등 심화.',
    'ethics_violation', 'blue', 2, 'https://www.assembly.go.kr', '국회·언론',
    10.0, '2024-02-01', true, 'medium', NULL,
    60, 200, false, 0.8,
    '정청래', '더불어민주당',
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"중앙일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '정청래', 'ethics_violation', 'blue',
      1, 60, 200, 1.3,
      'medium', true, 10.0,
      '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2024-02-01', '2024-12-03', NULL, 0.8,
      2, '사법위원장 이재명 방탄 국회 논란, 체포동의안·법안 처리 갈등', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 14. 명태균 게이트 — 대통령 부부 관련 정치 브로커 (2024)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '명태균 게이트 — 대통령 부부 관련 정치 브로커 구속',
    '정치 브로커 명태균이 대통령 부부와의 관계를 이용해 공천 개입·불법 정치자금 수수 혐의로 구속 기소. 녹취록에서 김건희 여사와의 통화 내용 공개, 공천 개입 정황 드러남.',
    'criminal_conviction', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스·검찰',
    28.0, '2024-11-07', true, 'high', 'indicted',
    90, 120, false, 1.2,
    '윤석열', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '윤석열', 'criminal_conviction', 'red',
      1, 90, 120, 1.3,
      'high', true, 28.0,
      '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2024-10-01', '2025-05-25', 'indicted', 1.2,
      2, '명태균 정치 브로커 구속, 대통령 부부 공천 개입·불법 정치자금 의혹', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 15. 국회의원 코인 투자 논란 — 김남국 등 (2023)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '김남국 의원 코인 60억 투자 — 국회의원 자산 신고 논란',
    '더불어민주당 김남국 의원이 재직 중 가상자산(위믹스)에 약 60억원을 투자한 사실이 드러나 이해충돌 논란. 민주당 탈당→무소속→조국혁신당 입당. 가상자산 이용자 보호법 발의자가 본인 투자한 점이 문제.',
    'ethics_violation', 'blue', 2, 'https://www.yonhapnews.co.kr', '연합뉴스',
    15.0, '2023-05-09', true, 'high', NULL,
    80, 60, false, 0.8,
    '김남국', '더불어민주당',
    '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '김남국', 'ethics_violation', 'blue',
      1, 80, 60, 1.3,
      'high', true, 15.0,
      '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2023-05-09', '2023-07-01', NULL, 0.8,
      2, '국회의원 재직 중 코인 60억 투자 이해충돌 논란, 탈당', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 16. 이준석 — 성접대 의혹·당원권 정지 (2022)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이준석 성접대 의혹 — 국민의힘 당대표 권한 정지·징계',
    '국민의힘 이준석 대표가 2013년 업체 관계자로부터 성접대를 받았다는 의혹. 당 윤리위 6개월 당원권 정지 징계. 이후 당 지도부와 갈등으로 신당(개혁신당) 창당.',
    'ethics_violation', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스',
    12.0, '2022-07-08', true, 'medium', NULL,
    70, 90, false, 1.0,
    '이준석', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '이준석', 'ethics_violation', 'red',
      1, 70, 90, 1.3,
      'medium', true, 12.0,
      '[{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2022-06-01', '2022-12-01', NULL, 1.0,
      2, '성접대 의혹 당원권 정지, 당 지도부 갈등 → 신당 창당', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 17. 나경원 — 자녀 미국 유학 스펙 의혹 (2019)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '나경원 자녀 스펙 쌓기 특혜 의혹',
    '나경원 의원 자녀의 미국 대학 입학 과정에서 국제기구 인턴·논문 공저 등 스펙 쌓기 특혜 의혹. 조국 자녀 입시 의혹과 맞물려 여야 모두의 입시 특혜 논란으로 확산.',
    'ethics_violation', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스·언론',
    10.0, '2019-09-20', true, 'medium', NULL,
    60, 30, false, 0.8,
    '나경원', '국민의힘',
    '[{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '나경원', 'ethics_violation', 'red',
      1, 60, 30, 1.3,
      'medium', true, 10.0,
      '[{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2019-09-01', '2019-10-15', NULL, 0.8,
      2, '자녀 미국 대학 스펙 쌓기 특혜 의혹, 입시 불공정 논란', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 18. 윤석열 탄핵 인용 — 헌재 결정 (2025)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '윤석열 대통령 탄핵 인용 — 헌법재판소 전원일치 파면',
    '2024년 12월 14일 국회 탄핵소추 후 2025년 4월 4일 헌법재판소 재판관 전원일치(8:0)로 탄핵 인용. 대한민국 역사상 두 번째 대통령 탄핵 파면. 60일 이내 대선 실시.',
    'criminal_conviction', 'red', 1, 'https://www.ccourt.go.kr', '헌법재판소',
    50.0, '2025-04-04', true, 'high', 'indicted',
    100, 120, false, 1.2,
    '윤석열', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"중앙일보","lean":"conservative"},{"name":"동아일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"},{"name":"경향신문","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '윤석열', 'criminal_conviction', 'red',
      1, 100, 120, 1.3,
      'high', true, 50.0,
      '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2024-12-14', '2025-05-25', 'indicted', 1.2,
      1, '헌법재판소 전원일치(8:0) 탄핵 인용 파면, 역대 두 번째 대통령 탄핵', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 19. 한동훈 — 검언유착·채상병 특검 갈등 (2024)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '한동훈 당대표 — 채상병 특검 거부→계엄 후 탄핵 찬성 전환',
    '국민의힘 당대표로서 채상병 특검법에 반대 입장. 12·3 비상계엄 후 윤석열 탄핵에 찬성으로 전환, 당내 친윤계와 갈등. 이후 당대표직 사퇴.',
    'controversial_statement', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스',
    0, '2024-12-07', true, 'high', NULL,
    80, 60, true, 1.0,
    '한동훈', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '한동훈', 'controversial_statement', 'red',
      1, 80, 60, 1.3,
      'high', true, 0,
      '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2024-07-23', '2025-01-15', NULL, 1.0,
      2, '채상병 특검 거부→계엄 후 탄핵 찬성 전환→당대표 사퇴', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 20. 이재명 체포동의안 부결 (2023)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이재명 체포동의안 국회 부결 — 여당 이탈표 논란',
    '2023년 9월 대장동·쌍방울 관련 뇌물·배임 혐의 체포동의안 국회 표결. 재적 299명 중 찬성 149·반대 136·기권 6·무효 8로 부결(재적 과반 미달). 여당 내 이탈표 발생 논란.',
    'criminal_conviction', 'blue', 1, 'https://www.assembly.go.kr', '국회',
    20.0, '2023-09-21', true, 'high', 'indicted',
    100, 30, false, 1.2,
    '이재명', '더불어민주당',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_issue_id;

  IF v_issue_id IS NOT NULL THEN
    INSERT INTO issue_clusters (
      representative_issue_id, actor_name, category, camp,
      issue_count, coverage_count, headline_days, media_diversity_score,
      trust_level, verified, weighted_score, cross_verified_sources,
      first_reported_at, last_reported_at, criminal_stage, position_weight,
      source_tier, summary, is_active
    ) VALUES (
      v_issue_id, '이재명', 'criminal_conviction', 'blue',
      1, 100, 30, 1.3,
      'high', true, 20.0,
      '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2023-09-18', '2023-09-25', 'indicted', 1.2,
      1, '체포동의안 국회 부결 (찬성 149 vs 재적 과반 150), 여당 이탈표 논란', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '2015-2025 주요 사건 시드 데이터 완료 (20건)';
END $$;
