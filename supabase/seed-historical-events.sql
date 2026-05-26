-- ============================================================
-- 역사 주요 형사 사건 시드 데이터
-- issues + issue_clusters 테이블
-- Supabase SQL Editor에서 실행
-- ============================================================

DO $$
DECLARE
  v_issue_id    UUID;
  v_cluster_id  UUID;
BEGIN

  -- ════════════════════════════════════════════
  -- 1. 전두환 — 12·12 군사반란 + 5·18 내란
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '전두환 12·12 군사반란·5·18 내란 대법원 확정',
    '1979년 12·12 군사반란과 1980년 5·18 광주민주화운동 유혈진압에 대해 내란수괴·군사반란수괴 혐의로 대법원 유죄 확정. 무기징역 선고 후 징역 17년으로 감형, 1997년 12월 특별사면.',
    'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원',
    50.0, '1997-04-17', true, 'high', 'pardoned',
    100, 365, false, 1.2,
    '전두환', '민주정의당',
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
      v_issue_id, '전두환', 'criminal_conviction', 'red',
      1, 100, 365, 1.3,
      'high', true, 50.0,
      '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '1995-11-24', '1997-12-22', 'pardoned', 1.2,
      1, '12·12 군사반란·5·18 내란 대법원 유죄 확정 (무기징역→사면)', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 2. 전두환 — 비자금 조성
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '전두환 비자금 2천억원대 조성·은닉',
    '대통령 재임 시절 기업으로부터 뇌물 수수 및 비자금 조성. 추징금 2,205억원 미납 상태로 사망(2021년). 대법원 뇌물 유죄 확정.',
    'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원',
    40.0, '1997-04-17', true, 'high', 'pardoned',
    80, 200, false, 1.2,
    '전두환', '민주정의당',
    '[{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
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
      v_issue_id, '전두환', 'criminal_conviction', 'red',
      1, 80, 200, 1.3,
      'high', true, 40.0,
      '[{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '1995-11-24', '2021-11-23', 'pardoned', 1.2,
      1, '비자금 2천억원대 조성·은닉, 추징금 미납 상태로 사망', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 3. 노태우 — 내란·군사반란·뇌물
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '노태우 12·12 군사반란·5·18 내란·비자금 대법원 확정',
    '12·12 군사반란 및 5·18 내란에 내란중요임무종사죄로 가담, 대통령 재임 중 비자금 2,359억원 수수. 대법원 징역 17년 확정 후 12년으로 감형, 1997년 12월 특별사면.',
    'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원',
    45.0, '1997-04-17', true, 'high', 'pardoned',
    90, 300, false, 1.2,
    '노태우', '민주정의당/민자당',
    '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"동아일보","lean":"conservative"},{"name":"경향신문","lean":"progressive"}]',
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
      v_issue_id, '노태우', 'criminal_conviction', 'red',
      1, 90, 300, 1.3,
      'high', true, 45.0,
      '[{"name":"KBS","lean":"center"},{"name":"SBS","lean":"center"},{"name":"동아일보","lean":"conservative"},{"name":"경향신문","lean":"progressive"}]',
      '1995-10-27', '1997-12-22', 'pardoned', 1.2,
      1, '12·12·5·18 내란 가담 + 비자금 2,359억원 대법원 확정 → 사면', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 4. 이명박 — 다스 실소유·뇌물·횡령
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이명박 다스(DAS) 실소유·뇌물수수·횡령 대법원 확정',
    '자동차 부품회사 다스(DAS)의 실소유주로서 횡령 및 삼성 등으로부터 뇌물 수수. 대법원 징역 17년·벌금 130억원 확정(2020년 10월). 2022년 12월 특별사면.',
    'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원',
    48.0, '2020-10-29', true, 'high', 'pardoned',
    95, 400, false, 1.2,
    '이명박', '한나라당/새누리당',
    '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"},{"name":"연합뉴스","lean":"center"}]',
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
      v_issue_id, '이명박', 'criminal_conviction', 'red',
      1, 95, 400, 1.3,
      'high', true, 48.0,
      '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"},{"name":"연합뉴스","lean":"center"}]',
      '2018-03-22', '2022-12-28', 'pardoned', 1.2,
      1, '다스 실소유·뇌물·횡령 대법원 확정 징역 17년 → 사면', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 5. 이명박 — 국정원 특활비 수수
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '이명박 국정원 특수활동비 수수 유죄',
    '국가정보원 특수활동비를 청와대로 상납받아 개인 용도로 사용. 대법원 뇌물수수 유죄 확정.',
    'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원',
    30.0, '2020-10-29', true, 'high', 'pardoned',
    70, 200, false, 1.2,
    '이명박', '한나라당/새누리당',
    '[{"name":"MBC","lean":"center"},{"name":"중앙일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
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
      v_issue_id, '이명박', 'criminal_conviction', 'red',
      1, 70, 200, 1.3,
      'high', true, 30.0,
      '[{"name":"MBC","lean":"center"},{"name":"중앙일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2018-03-22', '2020-10-29', 'pardoned', 1.2,
      1, '국정원 특수활동비 청와대 상납 뇌물수수 대법원 확정', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 6. 박근혜 — 국정농단
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '박근혜 국정농단 뇌물수수·직권남용 대법원 확정',
    '최순실(최서원)에게 국정 개입을 허용하고 삼성 등 대기업으로부터 뇌물 수수, 미르·K스포츠 재단 출연 강요. 대법원 징역 20년·벌금 180억원 확정(2021년 1월). 2017년 3월 헌재 탄핵 인용. 2021년 12월 특별사면.',
    'criminal_conviction', 'red', 1, 'https://www.law.go.kr', '대법원·헌법재판소',
    50.0, '2021-01-14', true, 'high', 'pardoned',
    100, 500, false, 1.2,
    '박근혜', '새누리당',
    '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"},{"name":"경향신문","lean":"progressive"}]',
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
      v_issue_id, '박근혜', 'criminal_conviction', 'red',
      1, 100, 500, 1.3,
      'high', true, 50.0,
      '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2016-10-24', '2021-12-31', 'pardoned', 1.2,
      1, '국정농단 뇌물·직권남용 대법원 확정 징역 20년 → 탄핵 → 사면', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 7. 노무현 — 정치자금 수수 수사
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '노무현 박연차 게이트 뇌물수수 혐의 수사',
    '퇴임 후 박연차 전 태광실업 회장으로부터 600만 달러 수수 혐의로 검찰 수사. 피의자 신분으로 조사 중 2009년 5월 23일 서거. 기소 전 사망으로 공소권 없음.',
    'criminal_conviction', 'blue', 2, 'https://www.yonhapnews.co.kr', '연합뉴스',
    15.0, '2009-04-30', true, 'high', 'investigation',
    80, 120, false, 1.2,
    '노무현', '열린우리당',
    '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
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
      v_issue_id, '노무현', 'criminal_conviction', 'blue',
      1, 80, 120, 1.3,
      'high', true, 15.0,
      '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2009-04-08', '2009-05-23', 'investigation', 1.2,
      2, '박연차 게이트 뇌물수수 혐의 수사 중 서거, 공소권 없음', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 8. 윤석열 — 12·3 비상계엄 내란
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '윤석열 12·3 비상계엄 선포 — 내란수괴 혐의 구속 기소',
    '2024년 12월 3일 비상계엄 선포. 국회 계엄 해제 의결, 6시간 만에 해제. 내란수괴 혐의로 체포·구속·기소. 2025년 4월 4일 헌법재판소 탄핵 인용으로 파면.',
    'criminal_conviction', 'red', 1, 'https://www.ccourt.go.kr', '헌법재판소',
    50.0, '2024-12-03', true, 'high', 'indicted',
    100, 180, false, 1.2,
    '윤석열', '국민의힘',
    '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"연합뉴스","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"중앙일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"},{"name":"경향신문","lean":"progressive"}]',
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
      1, 100, 180, 1.3,
      'high', true, 50.0,
      '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2024-12-03', '2025-05-25', 'indicted', 1.2,
      1, '12·3 비상계엄 내란수괴 구속 기소 → 헌재 탄핵 인용 파면', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 9. 김대중 — 대북 비밀송금 사건
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '대북 비밀송금 사건 — 남북정상회담 대가 송금 특검',
    '2000년 남북정상회담 성사 대가로 현대를 통해 북한에 5억 달러를 비밀 송금한 사건. 특별검사 수사 결과 임동원 통일부장관 등 기소. 김대중 본인은 피의자 신분 수사 없이 종결.',
    'official_misconduct', 'blue', 2, 'https://www.yonhapnews.co.kr', '연합뉴스',
    20.0, '2003-06-25', true, 'high', 'no_charges',
    70, 180, false, 1.2,
    '김대중', '새천년민주당',
    '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
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
      v_issue_id, '김대중', 'official_misconduct', 'blue',
      1, 70, 180, 1.3,
      'high', true, 20.0,
      '[{"name":"연합뉴스","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2003-01-01', '2003-06-25', 'no_charges', 1.2,
      2, '남북정상회담 대가 5억 달러 대북 비밀송금 특검 수사', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 10. 박근혜 — 세월호 7시간
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '세월호 참사 대통령 7시간 행적 불명',
    '2014년 4월 16일 세월호 침몰 당시 대통령의 7시간 행적이 공개되지 않아 논란. 304명 사망. 초동 대응 부재에 대한 직무유기 논란. 탄핵 사유의 하나로 포함.',
    'official_misconduct', 'red', 2, 'https://www.yonhapnews.co.kr', '연합뉴스·특조위',
    25.0, '2014-04-16', true, 'high', NULL,
    100, 365, false, 1.2,
    '박근혜', '새누리당',
    '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
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
      1, 100, 365, 1.3,
      'high', true, 25.0,
      '[{"name":"JTBC","lean":"center"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2014-04-16', '2017-03-10', NULL, 1.2,
      2, '세월호 참사 대통령 7시간 행적 불명, 초동 대응 부재 직무유기 논란', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════
  -- 11. 노무현 — 탄핵소추 (국회)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '노무현 국회 탄핵소추 — 헌재 기각',
    '2004년 3월 12일 국회에서 탄핵소추안 가결. 선거 중립 의무 위반 등 사유. 2004년 5월 14일 헌법재판소 기각 결정으로 직무 복귀.',
    'ethics_violation', 'blue', 1, 'https://www.ccourt.go.kr', '헌법재판소',
    10.0, '2004-05-14', true, 'high', 'dismissed',
    90, 63, false, 1.2,
    '노무현', '열린우리당',
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
      v_issue_id, '노무현', 'ethics_violation', 'blue',
      1, 90, 63, 1.3,
      'high', true, 10.0,
      '[{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"한겨레","lean":"progressive"}]',
      '2004-03-12', '2004-05-14', 'dismissed', 1.2,
      1, '국회 탄핵소추 → 헌법재판소 기각(2004)', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '역사 이벤트 시드 데이터 완료';
END $$;
