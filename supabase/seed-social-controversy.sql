-- 사회 이슈 시드 데이터
-- migration-008-social-controversy.sql 실행 후 실행

DO $$
DECLARE
  v_issue_id   UUID;
  v_cluster_id UUID;
BEGIN

  -- ════════════════════════════════════════════
  -- 1. 스타벅스 탱크데이 5·18 폄훼 논란 (2025)
  -- ════════════════════════════════════════════
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '스타벅스 탱크데이 5·18 폄훼 마케팅 → 이재명·정청래 등 고발',
    '스타벅스코리아가 5월 18일 ''탱크데이'' 텀블러 마케팅에서 ''책상에 탁!'' 문구를 사용해 5·18민주화운동과 고 박종철 열사를 조롱했다는 논란. 정용진 신세계그룹 회장·손정현 전 대표 고소. 시민단체가 이재명 대통령·윤호중 행안부장관·정청래 민주당 대표를 불매운동 강요·공직선거법 위반으로 맞고발.',
    'social_controversy', 'blue', 3, 'https://www.hani.co.kr/arti/society/society_general/1260295.html', '한겨레',
    0, '2025-05-18', true, 'high', NULL,
    100, 8, true, 1.2,
    '이재명', '더불어민주당',
    '[{"name":"한겨레","lean":"progressive"},{"name":"경향신문","lean":"progressive"},{"name":"KBS","lean":"center"},{"name":"MBC","lean":"center"},{"name":"SBS","lean":"center"},{"name":"JTBC","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"중앙일보","lean":"conservative"}]',
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
      v_issue_id, '이재명', 'social_controversy', 'blue',
      1, 100, 8, 1.3,
      'high', true, 0,
      '[{"name":"한겨레","lean":"progressive"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"}]',
      '2025-05-18', '2025-05-26', NULL, 1.2,
      3, '스타벅스 탱크데이 5·18 폄훼 논란 → 정용진 고소 + 이재명·정청래 맞고발', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  -- 빨강 측 시각 (맞고발)
  INSERT INTO issues (
    title, summary, category, camp, source_tier, source_url, source_name,
    weighted_score, published_at, verified, trust_level, criminal_stage,
    coverage_count, headline_days, is_archive, position_weight,
    actor_name, actor_party, cross_verified_sources, ai_analysis
  ) VALUES (
    '시민단체, 이재명·정청래 불매운동 강요·선거법 위반 고발',
    '서민민생대책위원회가 이재명 대통령·윤호중 행안부장관·정성호 법무부장관·안규백 국방부장관·정청래 민주당 대표를 직권남용·공직선거법 위반으로 고발. 정부가 앞장서 불매운동을 강요하며 6·3 지방선거를 앞둔 정치적 중립성을 훼손했다는 취지.',
    'social_controversy', 'red', 3, 'https://www.hani.co.kr/arti/society/society_general/1260295.html', '한겨레',
    0, '2025-05-25', true, 'high', NULL,
    80, 3, true, 1.2,
    '정청래', '더불어민주당',
    '[{"name":"한겨레","lean":"progressive"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"},{"name":"중앙일보","lean":"conservative"}]',
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
      v_issue_id, '정청래', 'social_controversy', 'red',
      1, 80, 3, 1.3,
      'high', true, 0,
      '[{"name":"한겨레","lean":"progressive"},{"name":"KBS","lean":"center"},{"name":"조선일보","lean":"conservative"}]',
      '2025-05-25', '2025-05-26', NULL, 0.8,
      3, '시민단체 맞고발: 정부·여당 불매운동 강요 + 선거법 위반 주장', true
    )
    RETURNING id INTO v_cluster_id;
    UPDATE issues SET event_id = v_cluster_id WHERE id = v_issue_id;
    INSERT INTO cluster_issues (cluster_id, issue_id) VALUES (v_cluster_id, v_issue_id) ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '사회 이슈 시드 데이터 완료';
END $$;
