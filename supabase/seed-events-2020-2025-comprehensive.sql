-- ============================================================
-- 2020–2025 주요 사건 포괄 시드 (마일스톤 기반)
-- 1 이벤트 = 1 사건 + N 이슈(마일스톤)
-- actor_name별 별도 이벤트
-- ============================================================
-- 실행 전: migration-008-social-controversy.sql 필요

DO $$
DECLARE
  v_issue_id    UUID;
  v_cluster_id  UUID;
  v_rep_id      UUID;
BEGIN

  -- ══════════════════════════════════════════════════════════
  -- [BLUE] 이재명 — 대장동 배임
  -- 2021 수사 → 2022 기소 → 2023~ 1심 공판
  -- ══════════════════════════════════════════════════════════
  -- 이벤트 생성 (대표 이슈는 나중에 업데이트)
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '이재명', 'criminal_conviction', 'blue', 3, 100, 1400, 1.3,
    'high', true, 35.0,
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2021-09-01', '2025-05-26', 'indicted', 1.2, 1,
    '성남 대장동 도시개발사업 특혜 배임 혐의 기소, 1심 재판 진행 중', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    -- 마일스톤 1: 수사 착수
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('이재명 대장동 개발 의혹 수사 착수', '성남시장 재임 시 대장동 도시개발사업에서 민간 업자 화천대유에 과도한 이익 배분 의혹으로 검찰 수사 착수.', 'criminal_conviction', 'blue', 2, 'https://www.yonhapnews.co.kr', '연합뉴스', 0, '2021-09-14', true, 'high', 'investigation', 80, 30, false, 1.2, '이재명', '더불어민주당', '[]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    -- 마일스톤 2: 기소
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('이재명 대장동 배임 혐의 기소', '검찰, 이재명 대표를 성남 대장동 개발사업 배임 혐의로 불구속 기소.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '검찰', 35.0, '2022-09-28', true, 'high', 'indicted', 100, 60, false, 1.2, '이재명', '더불어민주당', '[{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;

    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [BLUE] 이재명 — 공직선거법 위반
  -- 2023 기소 → 2024.11 1심 유죄 → 항소심
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '이재명', 'criminal_conviction', 'blue', 2, 100, 600, 1.3,
    'high', true, 40.0,
    '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2023-05-01', '2025-05-26', 'guilty_1st', 1.2, 1,
    '공직선거법 위반(허위사실 공표) 1심 유죄 벌금 150만원, 의원직 상실형. 항소심 진행 중.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('이재명 공직선거법 위반 1심 유죄 선고', '법원, 이재명 대표에게 공직선거법 위반(성남FC 후원금 허위사실 공표) 벌금 150만원 선고. 의원직 상실형. 항소.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '법원', 40.0, '2024-11-15', true, 'high', 'guilty_1st', 100, 30, false, 1.2, '이재명', '더불어민주당', '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;

    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [BLUE] 조국 — 자녀 입시비리·사모펀드
  -- 2019 기소 → 2021 1심 → 2023 2심 → 2024.01 대법 확정
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '조국', 'criminal_conviction', 'blue', 4, 100, 1600, 1.3,
    'high', true, 50.0,
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2019-08-27', '2024-01-25', 'confirmed', 1.0, 1,
    '자녀 입시비리·사모펀드 관련 대법원 유죄 확정 징역 2년. 2024년 1월 수감.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES
    ('조국 자녀 입시비리 기소', '검찰, 조국 전 법무부장관을 자녀 대학 입시 표창장 위조·사모펀드 배임 등 혐의로 기소.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '검찰', 10.0, '2019-10-24', true, 'high', 'indicted', 100, 30, false, 1.0, '조국', '더불어민주당', '[]', NULL, v_cluster_id),
    ('조국 1심 징역 2년 선고', '서울중앙지법, 조국 전 장관에게 자녀 입시비리 등 징역 2년 선고.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '법원', 30.0, '2021-08-12', true, 'high', 'guilty_1st', 100, 14, false, 1.0, '조국', '더불어민주당', '[]', NULL, v_cluster_id),
    ('조국 2심 징역 2년 유지', '서울고법 항소심에서 1심과 동일하게 징역 2년 선고.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '법원', 40.0, '2023-02-03', true, 'high', 'guilty_2nd', 90, 7, false, 1.0, '조국', '더불어민주당', '[]', NULL, v_cluster_id),
    ('조국 대법원 유죄 확정 징역 2년', '대법원, 조국 전 장관 상고 기각. 자녀 입시비리·사모펀드 유죄 확정. 수감.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '대법원', 50.0, '2024-01-25', true, 'high', 'confirmed', 100, 14, false, 1.0, '조국', '조국혁신당', '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_rep_id FROM issues WHERE actor_name = '조국' AND criminal_stage = 'confirmed' AND event_id = v_cluster_id LIMIT 1;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [BLUE] 김경수 — 드루킹 댓글 조작
  -- 2018 기소 → 2020 1심 → 2021 대법 확정 → 2023 사면
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '김경수', 'criminal_conviction', 'blue', 3, 90, 1800, 1.3,
    'high', true, 50.0,
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2018-08-27', '2023-12-29', 'pardoned', 0.8, 1,
    '드루킹 댓글 조작 공모 대법원 유죄 확정 징역 2년. 2023년 12월 특별사면.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES
    ('김경수 1심 징역 2년 선고', '서울중앙지법, 김경수 경남지사에게 드루킹 댓글 조작 공모 혐의로 징역 2년 선고. 법정 구속.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '법원', 30.0, '2020-11-06', true, 'high', 'guilty_1st', 80, 14, false, 0.8, '김경수', '더불어민주당', '[]', NULL, v_cluster_id),
    ('김경수 대법원 유죄 확정', '대법원, 김경수 전 지사 상고 기각. 댓글 조작 공모 유죄 확정 징역 2년.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '대법원', 50.0, '2021-07-21', true, 'high', 'confirmed', 90, 7, false, 0.8, '김경수', '더불어민주당', '[]', NULL, v_cluster_id),
    ('김경수 특별사면', '윤석열 대통령, 김경수 전 지사 특별사면 결정.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '법무부', 50.0, '2023-12-29', true, 'high', 'pardoned', 70, 3, false, 0.8, '김경수', '더불어민주당', '[]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_rep_id FROM issues WHERE actor_name = '김경수' AND criminal_stage = 'pardoned' AND event_id = v_cluster_id LIMIT 1;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 윤석열 — 12·3 비상계엄 내란
  -- 2024.12 계엄 → 탄핵소추 → 체포 → 기소 → 2025.04 헌재 인용
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '윤석열', 'criminal_conviction', 'red', 5, 100, 175, 1.3,
    'high', true, 50.0,
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2024-12-03', '2025-05-26', 'indicted', 1.2, 1,
    '12·3 비상계엄 선포. 내란수괴 혐의 체포·구속·기소. 헌재 탄핵 인용(8:0) 파면.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES
    ('윤석열 비상계엄 선포', '윤석열 대통령, 12월 3일 밤 비상계엄 선포. 국회 의결로 6시간 만에 해제.', 'criminal_conviction', 'red', 1, 'https://www.assembly.go.kr', '국회', 20.0, '2024-12-03', true, 'high', 'investigation', 100, 1, false, 1.2, '윤석열', '국민의힘', '[]', NULL, v_cluster_id),
    ('윤석열 국회 탄핵소추안 가결', '국회, 윤석열 대통령 탄핵소추안 찬성 204표로 가결. 직무 정지.', 'criminal_conviction', 'red', 1, 'https://www.assembly.go.kr', '국회', 30.0, '2024-12-14', true, 'high', 'investigation', 100, 3, false, 1.2, '윤석열', '국민의힘', '[]', NULL, v_cluster_id),
    ('윤석열 내란수괴 혐의 체포·구속', '공수처·경찰, 윤석열 전 대통령 내란수괴 혐의로 체포 후 구속영장 집행.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '법원', 40.0, '2025-01-19', true, 'high', 'indicted', 100, 7, false, 1.2, '윤석열', '국민의힘', '[]', NULL, v_cluster_id),
    ('윤석열 헌재 탄핵 인용 파면', '헌법재판소 재판관 전원일치(8:0) 탄핵 인용. 대한민국 역사상 두 번째 대통령 파면.', 'criminal_conviction', 'red', 1, 'https://www.ccourt.go.kr', '헌법재판소', 50.0, '2025-04-04', true, 'high', 'indicted', 100, 30, false, 1.2, '윤석열', '국민의힘', '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id),
    ('윤석열 내란수괴 1심 공판 시작', '서울중앙지법, 윤석열 전 대통령 내란수괴 혐의 1심 첫 공판 진행.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '법원', 50.0, '2025-05-20', true, 'high', 'indicted', 100, 5, false, 1.2, '윤석열', '국민의힘', '[]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_rep_id FROM issues WHERE actor_name = '윤석열' AND published_at = '2025-04-04' AND event_id = v_cluster_id LIMIT 1;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 김용현 — 12·3 내란 (국방부장관)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '김용현', 'criminal_conviction', 'red', 1, 80, 170, 1.3,
    'high', true, 30.0,
    '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2024-12-08', '2025-05-26', 'indicted', 0.8, 1,
    '12·3 비상계엄 집행 지시, 내란중요임무종사 혐의 구속 기소.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('김용현 국방부장관 내란 혐의 구속 기소', '검찰, 김용현 전 국방부장관을 12·3 비상계엄 집행 지시·내란중요임무종사 혐의로 구속 기소.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '검찰', 30.0, '2024-12-08', true, 'high', 'indicted', 80, 7, false, 0.8, '김용현', '국민의힘', '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 정진석 — 12·3 내란 (비서실장)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '정진석', 'criminal_conviction', 'red', 1, 70, 168, 1.3,
    'high', true, 25.0,
    '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"}]',
    '2024-12-10', '2025-05-26', 'indicted', 0.8, 1,
    '12·3 비상계엄 관련 내란 공모 혐의 구속 기소.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('정진석 비서실장 내란 공모 구속 기소', '검찰, 정진석 전 대통령실 비서실장을 비상계엄 관련 내란 공모 혐의로 구속 기소.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '검찰', 25.0, '2024-12-10', true, 'high', 'indicted', 70, 5, false, 0.8, '정진석', '국민의힘', '[]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 김건희 — 도이치모터스 + 디올백
  -- 2023 수사 → 2025.01 기소
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '김건희', 'criminal_conviction', 'red', 2, 100, 800, 1.3,
    'high', true, 35.0,
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2023-11-01', '2025-05-26', 'indicted', 1.2, 1,
    '도이치모터스 주가조작 공모·최재영 목사 명품백(디올백) 수수 혐의 기소. 재판 진행 중.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES
    ('김건희 도이치모터스 주가조작 수사', '검찰, 영부인 김건희의 도이치모터스 주가조작 공모 혐의 수사 착수.', 'criminal_conviction', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스', 10.0, '2023-11-15', true, 'high', 'investigation', 80, 30, false, 1.2, '김건희', '국민의힘', '[]', NULL, v_cluster_id),
    ('김건희 도이치모터스·디올백 기소', '검찰, 김건희를 도이치모터스 주가조작 공모·명품백 수수 혐의로 불구속 기소.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '검찰', 35.0, '2025-01-06', true, 'high', 'indicted', 100, 14, false, 1.2, '김건희', '국민의힘', '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_rep_id FROM issues WHERE actor_name = '김건희' AND criminal_stage = 'indicted' AND event_id = v_cluster_id LIMIT 1;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 이명박 — 다스 실소유 (대법 확정 → 사면)
  -- 2018 기소 → 2020 대법 확정 → 2022.12 사면
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '이명박', 'criminal_conviction', 'red', 3, 95, 1700, 1.3,
    'high', true, 50.0,
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2018-03-22', '2022-12-28', 'pardoned', 1.2, 1,
    '다스 실소유·뇌물·횡령 대법원 확정 징역 17년. 2022년 12월 특별사면.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES
    ('이명박 대법원 유죄 확정 징역 17년', '대법원, 이명박 전 대통령 다스(DAS) 실소유·뇌물·횡령 유죄 확정. 징역 17년·벌금 130억원.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원', 50.0, '2020-10-29', true, 'high', 'confirmed', 95, 14, false, 1.2, '이명박', '한나라당', '[]', NULL, v_cluster_id),
    ('이명박 수감', '이명박 전 대통령 대법원 확정 후 재수감.', 'criminal_conviction', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스', 40.0, '2020-11-02', true, 'high', 'confirmed', 80, 3, false, 1.2, '이명박', '한나라당', '[]', NULL, v_cluster_id),
    ('이명박 특별사면', '윤석열 대통령, 이명박 전 대통령 특별사면 결정. 징역 17년→사면.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '법무부', 50.0, '2022-12-28', true, 'high', 'pardoned', 90, 7, false, 1.2, '이명박', '한나라당', '[{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_rep_id FROM issues WHERE actor_name = '이명박' AND criminal_stage = 'pardoned' AND event_id = v_cluster_id LIMIT 1;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 박근혜 — 국정농단 (대법 확정 → 사면)
  -- 2017 기소 → 2018 1심 → 2020 2심 → 2021 대법 → 2021.12 사면
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '박근혜', 'criminal_conviction', 'red', 3, 100, 1700, 1.3,
    'high', true, 50.0,
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2017-04-17', '2021-12-31', 'pardoned', 1.2, 1,
    '국정농단 뇌물·직권남용 대법원 확정 징역 20년. 2021년 12월 특별사면.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES
    ('박근혜 대법원 유죄 확정 징역 20년', '대법원, 박근혜 전 대통령 국정농단 뇌물·직권남용 유죄 확정. 징역 20년·벌금 180억원.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원', 50.0, '2021-01-14', true, 'high', 'confirmed', 100, 14, false, 1.2, '박근혜', '새누리당', '[]', NULL, v_cluster_id),
    ('박근혜 특별사면', '문재인 대통령, 박근혜 전 대통령 특별사면 결정. 징역 20년→사면 석방.', 'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '법무부', 50.0, '2021-12-31', true, 'high', 'pardoned', 100, 7, false, 1.2, '박근혜', '새누리당', '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_rep_id FROM issues WHERE actor_name = '박근혜' AND criminal_stage = 'pardoned' AND event_id = v_cluster_id LIMIT 1;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 이태원 참사 (2022) — 윤석열 정부 대응
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '윤석열', 'official_misconduct', 'red', 2, 100, 400, 1.3,
    'high', true, 30.0,
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2022-10-29', '2023-10-29', NULL, 1.2, 1,
    '이태원 참사 159명 사망. 정부 초동 대응 부재, 이상민 행안부장관 탄핵소추(헌재 기각).', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES
    ('이태원 참사 159명 사망', '2022년 10월 29일 이태원 핼러윈 인파 압사로 159명 사망. 정부 초동 대응 부재 논란.', 'official_misconduct', 'red', 1, 'https://www.assembly.go.kr', '경찰청·국회', 30.0, '2022-10-29', true, 'high', NULL, 100, 365, false, 1.2, '윤석열', '국민의힘', '[]', NULL, v_cluster_id),
    ('이상민 행안부장관 탄핵소추 헌재 기각', '국회 탄핵소추 후 헌재 기각. 이태원 참사 부실 대응 책임 불인정.', 'official_misconduct', 'red', 1, 'https://www.ccourt.go.kr', '헌법재판소', 20.0, '2023-07-20', true, 'high', NULL, 80, 7, false, 0.8, '이상민', '국민의힘', '[]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_rep_id FROM issues WHERE actor_name = '윤석열' AND published_at = '2022-10-29' AND event_id = v_cluster_id LIMIT 1;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 의대 정원 2000명 증원 (2024)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '윤석열', 'official_misconduct', 'red', 1, 100, 480, 1.3,
    'high', true, 20.0,
    '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2024-02-06', '2025-05-26', NULL, 1.2, 1,
    '의대 정원 2000명 증원 강행. 전공의 약 1.2만 명 집단 사직, 의료 공백 장기화.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('의대 정원 2000명 증원 — 전공의 집단 사직', '2024년 2월 정부 의대 정원 2000명 증원 결정. 전공의 약 1.2만 명 집단 사직, 수련병원 의료 공백.', 'official_misconduct', 'red', 1, 'https://www.mohw.go.kr', '보건복지부', 20.0, '2024-02-06', true, 'high', NULL, 100, 365, false, 1.2, '윤석열', '국민의힘', '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [BLUE] 추미애 — 아들 군 휴가 특혜 (2020)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '추미애', 'ethics_violation', 'blue', 1, 70, 60, 1.3,
    'high', true, 15.0,
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2020-09-02', '2020-11-01', NULL, 0.8, 2,
    '법무부장관 재직 시 아들 군 휴가 특혜 의혹. 검찰총장과의 갈등 심화.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('추미애 아들 군 휴가 특혜 의혹', '추미애 법무부장관 아들의 군 복무 중 병가·휴가 특혜 의혹 제기. 검찰총장(윤석열)과의 갈등 심화.', 'ethics_violation', 'blue', 2, 'https://www.yonhapnews.co.kr', '연합뉴스', 15.0, '2020-09-02', true, 'high', NULL, 70, 60, false, 0.8, '추미애', '더불어민주당', '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 명태균 게이트 (2024)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '윤석열', 'criminal_conviction', 'red', 1, 90, 200, 1.3,
    'high', true, 28.0,
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2024-10-01', '2025-05-26', 'indicted', 1.2, 2,
    '정치 브로커 명태균 구속. 대통령 부부 관련 공천 개입·불법 정치자금 의혹.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('명태균 게이트 — 정치 브로커 구속 기소', '정치 브로커 명태균이 대통령 부부와의 관계를 이용해 공천 개입·불법 정치자금 수수 혐의로 구속 기소. 녹취록 공개.', 'criminal_conviction', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스', 28.0, '2024-11-07', true, 'high', 'indicted', 90, 30, false, 1.2, '윤석열', '국민의힘', '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 해병대 채상병 순직 수사 외압 (2023)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '윤석열', 'official_misconduct', 'red', 1, 90, 680, 1.3,
    'high', true, 25.0,
    '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2023-07-19', '2025-05-26', 'investigation', 1.2, 2,
    '해병대 채상병 순직사건 수사 외압·임성근 구명·이종섭 출국 논란. 공수처 수사.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('해병대 채상병 순직 수사 외압 의혹', '2023년 7월 해병대 일병 채상병 수해 복구 중 순직. 임성근 사단장 수사 중 대통령실·국방부 수사 외압 의혹. 이종섭 국방장관 사퇴→주호주대사 논란.', 'official_misconduct', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스·공수처', 25.0, '2023-07-19', true, 'high', 'investigation', 90, 300, false, 1.2, '윤석열', '국민의힘', '[{"name":"KBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [BLUE] 이재명 — 쌍방울 제3자 뇌물·위증교사
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '이재명', 'criminal_conviction', 'blue', 1, 80, 750, 1.3,
    'high', true, 25.0,
    '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"경향신문","lean":"progressive"}]',
    '2023-05-10', '2025-05-26', 'indicted', 1.2, 1,
    '쌍방울그룹 북측 대납 관련 제3자 뇌물수수·대장동 재판 위증교사 혐의 별도 기소. 재판 진행 중.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('이재명 쌍방울 제3자 뇌물·위증교사 기소', '검찰, 이재명 대표를 쌍방울그룹 북측 대납 관련 제3자 뇌물수수 및 대장동 재판 증인 위증교사 혐의로 별도 기소.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '검찰', 25.0, '2023-05-10', true, 'high', 'indicted', 80, 14, false, 1.2, '이재명', '더불어민주당', '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"경향신문","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [BLUE] 송영길 — 돈봉투 사건
  -- 2023 수사 → 2023 기소 → 재판 중
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '송영길', 'criminal_conviction', 'blue', 1, 80, 800, 1.3,
    'high', true, 20.0,
    '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
    '2023-01-15', '2025-05-26', 'indicted', 1.0, 1,
    '민주당 전당대회 돈봉투 살포 혐의 기소. 정치자금법 위반. 재판 진행 중.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('송영길 돈봉투 살포 혐의 기소', '검찰, 송영길 전 민주당 대표를 2022년 전당대회 돈봉투 살포(정치자금법 위반) 혐의로 구속 기소.', 'criminal_conviction', 'blue', 1, 'https://www.law.go.kr', '검찰', 20.0, '2023-04-07', true, 'high', 'indicted', 80, 14, false, 1.0, '송영길', '더불어민주당', '[{"name":"KBS","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- [RED] 오세훈 — GTX 철근 누락 (2025)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO issue_clusters (
    actor_name, category, camp, issue_count, coverage_count, headline_days,
    media_diversity_score, trust_level, verified, weighted_score,
    cross_verified_sources, first_reported_at, last_reported_at,
    criminal_stage, position_weight, source_tier, summary, is_active
  ) VALUES (
    '오세훈', 'official_misconduct', 'red', 1, 70, 10, 1.3,
    'high', true, 15.0,
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"오마이뉴스","lean":"progressive"},{"name":"조선일보","lean":"conservative"}]',
    '2025-05-20', '2025-05-26', NULL, 0.8, 2,
    'GTX-A 삼성역 철근 누락 중대 부실시공. 서울시 인수인계 누락·국토부 미보고. 국회 긴급 현안질의.', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cluster_id;

  IF v_cluster_id IS NOT NULL THEN
    INSERT INTO issues (title, summary, category, camp, source_tier, source_url, source_name, weighted_score, published_at, verified, trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight, actor_name, actor_party, cross_verified_sources, ai_analysis, event_id)
    VALUES ('GTX 철근 누락 — 서울시 중대 부실 은폐 논란', '국회 행안위 긴급 현안질의에서 GTX-A 삼성역 철근 누락 부실시공 확인. 현대건설·감리사·국토부 모두 중대 부실 인정, 서울시만 부인. 인수인계서 누락, 국토부와 17차례 대면 미보고.', 'official_misconduct', 'red', 1, 'https://www.assembly.go.kr', '국회·오마이뉴스', 15.0, '2025-05-26', true, 'high', NULL, 70, 5, false, 0.8, '오세훈', '국민의힘', '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"오마이뉴스","lean":"progressive"},{"name":"조선일보","lean":"conservative"}]', NULL, v_cluster_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rep_id;
    IF v_rep_id IS NOT NULL THEN
      UPDATE issue_clusters SET representative_issue_id = v_rep_id WHERE id = v_cluster_id;
      INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_rep_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RAISE NOTICE '2020-2025 포괄 시드 완료 (15개 사건, 30+ 마일스톤)';
END $$;
