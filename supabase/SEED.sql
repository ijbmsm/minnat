-- ============================================================================
-- 민낯(술자리) — 시드 데이터 (선택)
--
-- SETUP.sql 로 스키마를 만든 뒤 실행한다. 없어도 앱은 동작하며,
-- 크롤러가 새 이슈를 쌓기 시작하면 점차 채워진다.
--
-- 주의
--   · 정치인 시드는 22대 현직을 포함하지 않는다. 현직 319명은 크롤러의
--     sync_politicians 가 열린국회정보 ALLNAMEMBER 에서 자동 동기화한다.
--     이 시드는 전직·정부 인사 등 API 로 안 잡히는 인물 보완용이다.
--   · 이벤트 시드 3개는 기간이 겹칠 수 있다. 중복이 신경 쓰이면 필요한 것만 골라 실행.
--   · 재실행하면 같은 데이터가 다시 들어갈 수 있다. 원칙적으로 1회만 실행할 것.
--
-- 2026-09-16 로컬 Postgres 17 에서 전체 실행 검증 완료
-- (정치인 102명 / 이슈 66건 / 대통령 14명, 에러 0)
-- ============================================================================

-- ==========================================================================
-- [1/6] seed-politicians-expanded.sql
-- 정치인 — 2020~2025 주요 인물 + 과거 핵심 인물 (102명)
-- ==========================================================================

-- 정치인 DB 확장 — 2020~2025 주요 인물 + 과거 핵심 인물
-- Supabase SQL Editor에서 실행
-- ON CONFLICT DO NOTHING으로 기존 데이터 안전

DO $$
DECLARE
  v_blue UUID;
  v_red  UUID;
BEGIN
  SELECT id INTO v_blue FROM parties WHERE camp = 'blue';
  SELECT id INTO v_red  FROM parties WHERE camp = 'red';

  -- ══════════════════════════════════════════
  -- 더불어민주당 (blue) 계열
  -- ══════════════════════════════════════════
  INSERT INTO politicians (name, party_id, position, region, active) VALUES
    -- 현직/최근 주요 인물
    ('박찬대', v_blue, '원내대표', '부산', true),
    ('우원식', v_blue, '국회의장', NULL, true),
    ('김민석', v_blue, '의원', NULL, true),
    ('진성준', v_blue, '의원', NULL, true),
    ('김의겸', v_blue, '의원', NULL, true),
    ('한민수', v_blue, '의원', NULL, true),
    ('박주민', v_blue, '의원', NULL, true),
    ('김남국', v_blue, '전 의원', NULL, false),
    ('윤건영', v_blue, '의원', NULL, true),
    ('박민규', v_blue, '의원', NULL, true),
    ('오기형', v_blue, '의원', NULL, true),
    ('김용민', v_blue, '의원', NULL, true),
    ('이소영', v_blue, '의원', NULL, true),
    ('고민정', v_blue, '의원', NULL, true),
    ('강선우', v_blue, '의원', NULL, true),
    ('최강욱', v_blue, '전 의원', NULL, false),
    -- 전직 주요 인물 (2020~2025 뉴스에 등장)
    ('송영길', v_blue, '전 대표', NULL, false),
    ('윤미향', v_blue, '전 의원', NULL, false),
    ('손혜원', v_blue, '전 의원', NULL, false),
    ('임종석', v_blue, '전 비서실장', NULL, false),
    ('양정철', v_blue, '전 정책기획위원장', NULL, false),
    ('김경수', v_blue, '전 경남지사', '경남', false),
    ('이광재', v_blue, '전 의원', NULL, false),
    ('박원순', v_blue, '전 서울시장', '서울', false),
    ('오거돈', v_blue, '전 부산시장', '부산', false),
    ('안희정', v_blue, '전 충남지사', '충남', false),
    ('김경협', v_blue, '의원', NULL, true),
    ('유재수', v_blue, '전 부산시 부시장', '부산', false),
    ('송철호', v_blue, '전 울산시장', '울산', false),
    ('정봉주', v_blue, '전 의원', NULL, false),
    ('김홍걸', v_blue, '전 의원', NULL, false),
    ('노웅래', v_blue, '전 의원', NULL, false),
    ('이상직', v_blue, '전 의원', NULL, false),
    ('정정순', v_blue, '전 의원', NULL, false),
    ('윤관석', v_blue, '전 의원', NULL, false),
    ('이성만', v_blue, '전 의원', NULL, false),
    -- 조국혁신당
    ('조국', v_blue, '조국혁신당 대표', NULL, true),
    ('강미정', v_blue, '조국혁신당 의원', NULL, true),
    ('황운하', v_blue, '전 의원', NULL, false)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════
  -- 국민의힘 (red) 계열
  -- ══════════════════════════════════════════
  INSERT INTO politicians (name, party_id, position, region, active) VALUES
    -- 현직/최근 주요 인물
    ('장동혁', v_red, '대표', NULL, true),
    ('추경호', v_red, '의원', NULL, true),
    ('김상훈', v_red, '의원', NULL, true),
    ('유의동', v_red, '의원', NULL, true),
    ('배현진', v_red, '의원', '서울', true),
    ('김용태', v_red, '의원', NULL, true),
    ('윤희숙', v_red, '전 의원', NULL, false),
    ('박민식', v_red, '전 보훈부장관', NULL, false),
    ('원희룡', v_red, '전 국토부장관', NULL, false),
    ('이동관', v_red, '전 방통위원장', NULL, false),
    ('박순애', v_red, '전 교육부장관', NULL, false),
    ('이상민', v_red, '전 행안부장관', NULL, false),
    ('이종섭', v_red, '전 국방부장관', NULL, false),
    ('김용현', v_red, '전 국방부장관', NULL, false),
    ('정진석', v_red, '전 비서실장', NULL, false),
    ('조지호', v_red, '전 경찰청장', NULL, false),
    ('여인형', v_red, '전 방첩사령관', NULL, false),
    -- 전직 주요 인물
    ('황교안', v_red, '전 대표', NULL, false),
    ('김종인', v_red, '전 비대위원장', NULL, false),
    ('주호영', v_red, '전 원내대표', NULL, true),
    ('정우택', v_red, '전 원내대표', NULL, false),
    ('심재철', v_red, '전 원내대표', NULL, false),
    ('곽상도', v_red, '전 의원', NULL, false),
    ('정찬민', v_red, '전 용인시장', '용인', false),
    ('김성태', v_red, '전 원내대표', NULL, false),
    ('이우현', v_red, '전 의원', NULL, false),
    ('엄태영', v_red, '전 의원', NULL, false),
    ('전봉민', v_red, '전 의원', NULL, false),
    ('강효상', v_red, '전 의원', NULL, false),
    -- 김건희는 정치인은 아니지만 actor로 잡히므로
    ('김건희', v_red, '전 영부인', NULL, false)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '정치인 확장 완료';
END $$;


-- ==========================================================================
-- [2/6] seed-presidents.sql
-- 역대 대통령 프로필·공약·사면 등 (14명)
-- ==========================================================================

-- ============================================================
-- 역대 대통령 시드 데이터
-- Supabase SQL Editor에서 실행
-- 멱등성 보장: 중복 실행 시 기존 데이터 유지
-- ============================================================

DO $$
DECLARE
  v_pol_id   UUID;
  v_pres_id  UUID;
  v_blue     UUID;
  v_red      UUID;
BEGIN
  SELECT id INTO v_blue FROM parties WHERE camp = 'blue';
  SELECT id INTO v_red  FROM parties WHERE camp = 'red';

  -- ════════════════════════════════════════════
  -- 1대 이승만 (1948–1960)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '이승만';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('이승만', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1948-07-24', '1960-04-27', 1, 'resignation', '자유당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '이기붕', '부통령/측근', 'criminal_conviction', 'confirmed', '3·15 부정선거 주도, 4·19 혁명 후 일가족 자결', '사망', '1960-04-28'),
    (v_pres_id, '이강석', '양자', 'criminal_conviction', 'confirmed', '이기붕 양자, 일가족 자결 가담', '사망', '1960-04-28')
  ON CONFLICT DO NOTHING;

  -- 경제 (재임기간 중 주요 지표)
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 1954, 5.5, NULL, 30.0),
    (v_pres_id, 1955, 4.5, NULL, 55.0),
    (v_pres_id, 1956, -1.4, NULL, 27.0),
    (v_pres_id, 1957, 7.6, NULL, 20.0),
    (v_pres_id, 1958, 5.2, NULL, -3.0),
    (v_pres_id, 1959, 3.9, NULL, 1.5)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- ════════════════════════════════════════════
  -- 4대 윤보선 (1960–1962)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '윤보선';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('윤보선', v_blue, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1960-08-13', '1962-03-24', 4, 'coup', '민주당')
  ON CONFLICT (politician_id) DO NOTHING;

  -- ════════════════════════════════════════════
  -- 5대 박정희 (1963–1979)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '박정희';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('박정희', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1963-12-17', '1979-10-26', 5, 'assassination', '민주공화당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '육영수', '영부인', 'controversy', NULL, '1974년 문세광 저격 사건으로 서거', '피해자', '1974-08-15'),
    (v_pres_id, '차지철', '경호실장', 'criminal_conviction', 'confirmed', '10·26 사건 당시 사망', '사망', '1979-10-26'),
    (v_pres_id, '김형욱', '중앙정보부장', 'criminal_conviction', NULL, '중앙정보부장 재임 시 인권탄압, 이후 해외 망명 중 실종', '실종·사망 추정', '1979-10-01'),
    (v_pres_id, '박종규', '경호실장', 'criminal_conviction', 'confirmed', '부정축재 혐의로 유죄', '징역', '1980-01-01')
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 1964, 9.6, NULL, 29.5),
    (v_pres_id, 1965, 5.8, NULL, 13.6),
    (v_pres_id, 1966, 12.7, NULL, 11.4),
    (v_pres_id, 1967, 6.6, NULL, 10.9),
    (v_pres_id, 1968, 11.3, NULL, 10.8),
    (v_pres_id, 1969, 13.8, NULL, 12.4),
    (v_pres_id, 1970, 7.6, NULL, 15.9),
    (v_pres_id, 1971, 9.8, NULL, 13.5),
    (v_pres_id, 1972, 5.8, NULL, 11.7),
    (v_pres_id, 1973, 14.1, NULL, 3.1),
    (v_pres_id, 1974, 8.0, NULL, 24.3),
    (v_pres_id, 1975, 7.3, NULL, 25.3),
    (v_pres_id, 1976, 13.2, NULL, 15.3),
    (v_pres_id, 1977, 10.3, NULL, 10.2),
    (v_pres_id, 1978, 9.3, NULL, 14.5),
    (v_pres_id, 1979, 8.2, NULL, 18.3)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- ════════════════════════════════════════════
  -- 10대 최규하 (1979–1980)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '최규하';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('최규하', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1979-12-06', '1980-08-16', 10, 'coup', '무소속')
  ON CONFLICT (politician_id) DO NOTHING;

  -- ════════════════════════════════════════════
  -- 11대 전두환 (1980–1988)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '전두환';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('전두환', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1980-09-01', '1988-02-24', 11, 'normal', '민주정의당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '이순자', '영부인', 'criminal_conviction', 'confirmed', '비자금 조성·횡령 혐의 유죄 확정', '징역 2년 집행유예', '2004-03-26'),
    (v_pres_id, '전경환', '동생', 'criminal_conviction', 'confirmed', '새마을운동본부 비리, 횡령·배임 유죄', '징역 7년', '1988-11-01'),
    (v_pres_id, '장세동', '안기부장', 'criminal_conviction', 'confirmed', '12·12 군사반란·5·18 내란 가담 유죄', '징역 8년→사면', '1997-04-17'),
    (v_pres_id, '이학봉', '안기부 차장', 'criminal_conviction', 'confirmed', '5공 비리 관련 유죄', '징역', '1996-01-01'),
    (v_pres_id, '허삼수', '보안사령관', 'criminal_conviction', 'confirmed', '12·12 군사반란 가담', '징역 8년→사면', '1997-04-17'),
    (v_pres_id, '허화평', '비서실장', 'criminal_conviction', 'confirmed', '비자금 조성 관여 유죄', '징역', '1996-01-01')
  ON CONFLICT DO NOTHING;

  -- 사면
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'received', '전두환', '전 대통령', '내란수괴·군사반란수괴·뇌물', '무기징역(감형→징역 17년)', '1997-12-22', '김영삼')
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 1981, 7.2, 4.5, 21.3),
    (v_pres_id, 1982, 8.3, 4.4, 7.2),
    (v_pres_id, 1983, 12.2, 4.1, 3.4),
    (v_pres_id, 1984, 9.9, 3.8, 2.3),
    (v_pres_id, 1985, 7.5, 4.0, 2.5),
    (v_pres_id, 1986, 12.2, 3.8, 2.8),
    (v_pres_id, 1987, 12.3, 3.1, 3.1)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- ════════════════════════════════════════════
  -- 13대 노태우 (1988–1993)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '노태우';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('노태우', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1988-02-25', '1993-02-24', 13, 'normal', '민주정의당/민자당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '노재헌', '형', 'criminal_conviction', 'confirmed', '뇌물수수·알선수뢰 유죄', '징역 3년', '1995-01-01'),
    (v_pres_id, '박철언', '내무장관', 'criminal_conviction', 'confirmed', '비자금 관련 뇌물수수', '징역 3년 6개월', '1996-01-01'),
    (v_pres_id, '이현우', '안기부장', 'criminal_conviction', 'confirmed', '12·12·5·18 내란 가담', '징역 6년→사면', '1997-04-17')
  ON CONFLICT DO NOTHING;

  -- 사면
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'received', '노태우', '전 대통령', '내란중요임무종사·군사반란·뇌물', '징역 17년(감형→징역 12년)', '1997-12-22', '김영삼')
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 1988, 11.7, 2.5, 7.1),
    (v_pres_id, 1989, 6.8, 2.6, 5.7),
    (v_pres_id, 1990, 9.3, 2.4, 8.6),
    (v_pres_id, 1991, 9.7, 2.4, 9.3),
    (v_pres_id, 1992, 5.8, 2.5, 6.2)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- ════════════════════════════════════════════
  -- 14대 김영삼 (1993–1998)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '김영삼';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('김영삼', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1993-02-25', '1998-02-24', 14, 'normal', '민자당/신한국당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '김현철', '차남', 'criminal_conviction', 'confirmed', '한보그룹 특혜대출 알선·뇌물수수 유죄 확정', '징역 2년', '1997-11-28'),
    (v_pres_id, '정태수', '한보그룹 회장/측근', 'criminal_conviction', 'confirmed', '은행 특혜대출 5조원 사기·횡령', '징역 15년', '1998-06-01'),
    (v_pres_id, '홍인길', '안기부장', 'investigation', 'indicted', '불법 도청 혐의', '기소', '1997-01-01'),
    (v_pres_id, '최형우', '내무장관', 'criminal_conviction', 'confirmed', '총선 개입·선거법 위반', '유죄', '1997-01-01')
  ON CONFLICT DO NOTHING;

  -- 경제 (IMF 외환위기 포함)
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 1993, 6.3, 2.9, 4.8),
    (v_pres_id, 1994, 8.8, 2.5, 6.3),
    (v_pres_id, 1995, 9.6, 2.1, 4.5),
    (v_pres_id, 1996, 7.2, 2.0, 4.9),
    (v_pres_id, 1997, 5.8, 2.6, 4.4)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- ════════════════════════════════════════════
  -- 15대 김대중 (1998–2003)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '김대중';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('김대중', v_blue, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '1998-02-25', '2003-02-24', 15, 'normal', '새정치국민회의/새천년민주당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '김홍일', '장남', 'criminal_conviction', 'confirmed', '뇌물수수·알선수재 유죄', '징역 2년 집행유예', '2002-08-01'),
    (v_pres_id, '김홍업', '차남', 'criminal_conviction', 'confirmed', '뇌물수수·알선수재 유죄', '징역 1년', '2002-12-01'),
    (v_pres_id, '김홍걸', '삼남', 'criminal_conviction', 'confirmed', '세금 포탈 유죄', '벌금형', '2003-01-01'),
    (v_pres_id, '이용호', '측근 의원', 'criminal_conviction', 'confirmed', '대북 비밀송금(현대-대북송금 사건) 관련 뇌물수수', '징역 1년', '2003-06-01'),
    (v_pres_id, '임동원', '통일부장관', 'investigation', 'no_charges', '남북정상회담 대북 송금 특검 수사 대상', '혐의없음', '2003-06-01')
  ON CONFLICT DO NOTHING;

  -- 사면 (부여)
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'granted', '전두환', '전 대통령', '내란수괴·군사반란수괴·뇌물', '무기징역→징역 17년', '1997-12-22', NULL),
    (v_pres_id, 'granted', '노태우', '전 대통령', '내란·군사반란·뇌물', '징역 17년→12년', '1997-12-22', NULL)
  ON CONFLICT DO NOTHING;

  -- 경제 (IMF 극복기)
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 1998, -5.5, 7.0, 7.5),
    (v_pres_id, 1999, 10.7, 6.3, 0.8),
    (v_pres_id, 2000, 8.9, 4.1, 2.3),
    (v_pres_id, 2001, 4.5, 4.0, 4.1),
    (v_pres_id, 2002, 7.4, 3.3, 2.8)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- 공약
  INSERT INTO president_promises (president_id, promise, category, status, detail) VALUES
    (v_pres_id, 'IMF 외환위기 극복', '경제', 'fulfilled', '1998년 외환위기 조기 졸업, 2001년 IMF 차관 전액 상환'),
    (v_pres_id, '남북 정상회담 개최', '외교', 'fulfilled', '2000년 6·15 남북정상회담, 노벨평화상 수상'),
    (v_pres_id, '국민기초생활보장제도 도입', '복지', 'fulfilled', '2000년 10월 시행'),
    (v_pres_id, 'IT 강국 육성', '산업', 'fulfilled', '초고속인터넷 보급률 세계 1위 달성'),
    (v_pres_id, '햇볕정책 지속', '외교', 'partial', '남북 교류 확대했으나 핵 문제 해결 미흡')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════
  -- 16대 노무현 (2003–2008)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '노무현';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('노무현', v_blue, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '2003-02-25', '2008-02-24', 16, 'normal', '새천년민주당/열린우리당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '권양숙', '영부인', 'investigation', 'no_charges', '박연차 사건 관련 수사, 혐의없음 처분', '혐의없음', '2009-06-01'),
    (v_pres_id, '노건평', '형', 'criminal_conviction', 'confirmed', '세종증권 주가조작·알선수재 유죄', '징역 1년', '2004-04-01'),
    (v_pres_id, '정상문', '비서관', 'criminal_conviction', 'confirmed', '봉하마을 사저 부지 매입 관련 뇌물수수', '유죄', '2009-01-01'),
    (v_pres_id, '이광재', '보좌관 출신 의원', 'criminal_conviction', 'guilty_1st', '대선자금 불법 모금 유죄(이후 재심 무죄)', '징역 1년 6개월→무죄', '2008-01-01'),
    (v_pres_id, '안희정', '비서실장 출신', 'criminal_conviction', 'confirmed', '비서 성폭력 대법원 유죄 확정', '징역 3년 6개월', '2019-09-09')
  ON CONFLICT DO NOTHING;

  -- 사면 (부여)
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'granted', '이용호', '국회의원', '뇌물수수·알선수재', '징역 1년', '2007-01-01', NULL),
    (v_pres_id, 'granted', '서청원', '국회의원', '뇌물수수', '징역 1년 6개월', '2007-01-01', NULL)
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 2003, 2.9, 3.6, 3.5),
    (v_pres_id, 2004, 4.9, 3.7, 3.6),
    (v_pres_id, 2005, 3.9, 3.7, 2.8),
    (v_pres_id, 2006, 5.2, 3.5, 2.2),
    (v_pres_id, 2007, 5.5, 3.2, 2.5)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- 공약
  INSERT INTO president_promises (president_id, promise, category, status, detail) VALUES
    (v_pres_id, '행정수도 이전', '행정', 'partial', '충남 세종시로 행정중심복합도시 추진, 헌재 위헌 결정으로 수정'),
    (v_pres_id, '국가균형발전', '지역', 'partial', '혁신도시·기업도시 추진, 수도권 집중은 지속'),
    (v_pres_id, '과거사 진상규명', '인권', 'fulfilled', '진실화해위원회 출범(2005년)'),
    (v_pres_id, '한미 FTA 추진', '경제', 'fulfilled', '2007년 타결(이명박 정부에서 비준)'),
    (v_pres_id, '부동산 안정', '부동산', 'broken', '재임기간 중 부동산 가격 급등, 종합부동산세 도입했으나 효과 제한')
  ON CONFLICT DO NOTHING;

  -- 논란 인사
  INSERT INTO president_appointments (president_id, appointee_name, position_appointed, issue, result, date) VALUES
    (v_pres_id, '이용섭', '건설교통부장관', '부동산 정책 실패 논란', '임명 강행', '2006-11-01'),
    (v_pres_id, '김병준', '교육부총리', '청문회 논란(논문 표절 의혹)', '임명 강행', '2006-07-01')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════
  -- 17대 이명박 (2008–2013)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '이명박';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('이명박', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '2008-02-25', '2013-02-24', 17, 'normal', '한나라당/새누리당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '이상득', '친형', 'criminal_conviction', 'confirmed', '뇌물수수(포스코건설 로비) 유죄 확정', '징역 2년', '2014-10-17'),
    (v_pres_id, '김백준', '청와대 총무기획관', 'criminal_conviction', 'confirmed', '국정원 특활비 상납 주도 유죄', '징역 5년', '2020-10-29'),
    (v_pres_id, '김희중', '내곡동 사저 관련', 'criminal_conviction', 'confirmed', '내곡동 사저 부지 매입 의혹, 위증', '유죄', '2013-01-01'),
    (v_pres_id, '최시중', '방통위원장', 'criminal_conviction', 'confirmed', '종합편성채널 특혜 선정·뇌물수수', '징역 1년 6개월', '2017-01-01'),
    (v_pres_id, '이재오', '특임장관', 'criminal_conviction', 'confirmed', '정치자금법 위반·뇌물수수', '의원직 상실', '2015-01-01')
  ON CONFLICT DO NOTHING;

  -- 사면 (받은 사면)
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'received', '이명박', '전 대통령', '뇌물수수·횡령·조세포탈(다스 실소유)', '징역 17년·벌금 130억원', '2022-12-28', '윤석열')
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 2008, 2.8, 3.2, 4.7),
    (v_pres_id, 2009, 0.7, 3.6, 2.8),
    (v_pres_id, 2010, 6.5, 3.7, 3.0),
    (v_pres_id, 2011, 3.7, 3.4, 4.0),
    (v_pres_id, 2012, 2.4, 3.2, 2.2)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- 공약
  INSERT INTO president_promises (president_id, promise, category, status, detail) VALUES
    (v_pres_id, '747 공약 (7% 성장, 4만불 소득, 7대 강국)', '경제', 'broken', '글로벌 금융위기로 실현 불가, 임기 평균 성장률 3.2%'),
    (v_pres_id, '한반도 대운하', '인프라', 'partial', '대운하 → 4대강 사업으로 축소 변경, 22조원 투입'),
    (v_pres_id, '반값 등록금', '교육', 'broken', '공약 미이행, 등록금 부담 지속'),
    (v_pres_id, '비핵·개방 3000 (대북정책)', '외교', 'broken', '남북관계 경색, 금강산 관광 중단'),
    (v_pres_id, '세종시 원안 수정', '행정', 'broken', '수정안 국회 부결(2010년)')
  ON CONFLICT DO NOTHING;

  -- 논란 인사
  INSERT INTO president_appointments (president_id, appointee_name, position_appointed, issue, result, date) VALUES
    (v_pres_id, '강만수', '기획재정부장관', '부동산 규제 완화·감세 정책 논란', '임명 강행', '2008-02-29'),
    (v_pres_id, '정운찬', '국무총리', '세종시 수정안 추진 논란', '임명', '2009-09-29'),
    (v_pres_id, '박영준', '국방차관', '방산비리 연루 의혹', '낙마', '2008-02-01'),
    (v_pres_id, '이동관', '청와대 홍보수석', '언론장악 논란, 미디어법 강행 처리 주도', '임명 강행', '2008-03-01'),
    (v_pres_id, '김성호', '국정원장', '댓글 여론조작 사건 지시 의혹', '임명 강행', '2008-02-01')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════
  -- 18대 박근혜 (2013–2017)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '박근혜';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('박근혜', v_red, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '2013-02-25', '2017-03-10', 18, 'impeachment', '새누리당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '최순실(최서원)', '비선실세', 'criminal_conviction', 'confirmed', '국정농단·직권남용·뇌물 대법원 유죄 확정', '징역 18년', '2020-06-15'),
    (v_pres_id, '정유라', '최순실 딸', 'criminal_conviction', 'confirmed', '이화여대 입학·학점 특혜, 관련 업무방해 유죄', '유죄', '2020-01-01'),
    (v_pres_id, '안종범', '정책조정수석', 'criminal_conviction', 'confirmed', '기업 강제 출연(미르·K스포츠 재단) 직권남용', '징역 6년', '2018-06-14'),
    (v_pres_id, '정호성', '부속비서관', 'criminal_conviction', 'confirmed', '대통령 연설문 등 기밀문서 최순실에게 유출', '징역 2년 6개월', '2018-07-19'),
    (v_pres_id, '차은택', '문화계 블랙리스트', 'criminal_conviction', 'confirmed', '문화체육관광부 블랙리스트 작성·집행 관여', '유죄', '2018-01-01'),
    (v_pres_id, '우병우', '민정수석', 'criminal_conviction', 'confirmed', '직권남용·민간인 사찰 유죄', '징역 1년 6개월', '2019-08-29'),
    (v_pres_id, '김기춘', '비서실장', 'criminal_conviction', 'confirmed', '문화예술계 블랙리스트 작성 지시, 직권남용', '징역 4년→파기환송', '2018-07-19'),
    (v_pres_id, '이재용', '삼성전자 부회장/재벌', 'criminal_conviction', 'confirmed', '뇌물공여 (국정농단 연루, 삼성 지원금)', '징역 2년 6개월·집행유예→사면', '2022-08-15')
  ON CONFLICT DO NOTHING;

  -- 사면
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'received', '박근혜', '전 대통령', '뇌물수수·직권남용·강요(국정농단)', '징역 20년·벌금 180억원', '2021-12-31', '문재인')
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 2013, 3.2, 3.1, 1.3),
    (v_pres_id, 2014, 3.2, 3.5, 1.3),
    (v_pres_id, 2015, 2.8, 3.6, 0.7),
    (v_pres_id, 2016, 2.9, 3.7, 1.0)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- 공약
  INSERT INTO president_promises (president_id, promise, category, status, detail) VALUES
    (v_pres_id, '경제민주화', '경제', 'broken', '대기업 규제 관련 공약 대부분 후퇴'),
    (v_pres_id, '4대 악 근절 (성폭력·학교폭력·가정폭력·불량식품)', '사회', 'partial', '일부 법률 강화, 실질 효과는 제한적'),
    (v_pres_id, '기초연금 20만원', '복지', 'partial', '2014년 도입, 소득 하위 70%에만 적용'),
    (v_pres_id, '비정규직 차별 해소', '고용', 'broken', '비정규직 비율 오히려 증가'),
    (v_pres_id, '통일 대박론', '외교', 'broken', '남북관계 경색 지속, 개성공단 폐쇄(2016)')
  ON CONFLICT DO NOTHING;

  -- 논란 인사
  INSERT INTO president_appointments (president_id, appointee_name, position_appointed, issue, result, date) VALUES
    (v_pres_id, '문창극', '국무총리 후보', '역사관 논란(일제 식민지배·분단 하나님 뜻 발언)', '자진사퇴', '2014-06-24'),
    (v_pres_id, '안대희', '국무총리 후보', '변호사 수임료 논란(2개월 36억원)', '자진사퇴', '2014-05-28'),
    (v_pres_id, '김병준', '국무총리 후보', '세금 탈루·위장전입 논란', '자진사퇴', '2014-07-10'),
    (v_pres_id, '우병우', '민정수석', '가족 비리·부동산 의혹, 민간인 사찰 논란', '임명 강행', '2015-06-01')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════
  -- 19대 문재인 (2017–2022)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '문재인';
  IF v_pol_id IS NULL THEN
    INSERT INTO politicians (name, party_id, position, region, active)
    VALUES ('문재인', v_blue, '전 대통령', NULL, false)
    RETURNING id INTO v_pol_id;
  END IF;

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '2017-05-10', '2022-05-09', 19, 'normal', '더불어민주당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '조국', '법무부장관', 'criminal_conviction', 'confirmed', '자녀 입시비리·사모펀드 관련 대법원 유죄 확정', '징역 2년', '2024-01-25'),
    (v_pres_id, '김경수', '경남지사', 'criminal_conviction', 'confirmed', '드루킹 댓글 조작 공모 대법원 유죄 확정', '징역 2년', '2021-07-21'),
    (v_pres_id, '양정철', '정치전략가', 'controversy', NULL, '청와대 정무비서관실 과도한 영향력 행사 논란', NULL, '2019-01-01'),
    (v_pres_id, '송철호', '울산시장', 'criminal_conviction', 'confirmed', '울산시장 선거 개입(청와대 하명수사) 유죄', '유죄', '2023-01-01'),
    (v_pres_id, '유재수', '부산시 경제부시장', 'criminal_conviction', 'confirmed', '감찰 무마 의혹(조국 관련)', '유죄', '2021-01-01')
  ON CONFLICT DO NOTHING;

  -- 사면 (부여)
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'granted', '박근혜', '전 대통령', '뇌물수수·직권남용(국정농단)', '징역 20년·벌금 180억원', '2021-12-31', NULL),
    (v_pres_id, 'granted', '한명숙', '전 국무총리', '정치자금 불법수수', '징역 2년', '2022-01-01', NULL)
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 2017, 3.2, 3.7, 1.9),
    (v_pres_id, 2018, 2.9, 3.8, 1.5),
    (v_pres_id, 2019, 2.2, 3.8, 0.4),
    (v_pres_id, 2020, -0.7, 4.0, 0.5),
    (v_pres_id, 2021, 4.3, 3.7, 2.5)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- 공약
  INSERT INTO president_promises (president_id, promise, category, status, detail) VALUES
    (v_pres_id, '적폐 청산', '사법', 'partial', '국정농단 수사·재판 완료, 일부 과잉수사 논란'),
    (v_pres_id, '소득주도성장', '경제', 'broken', '최저임금 급등→자영업 타격, 소득 양극화 개선 미미'),
    (v_pres_id, '부동산 안정', '부동산', 'broken', '26차례 부동산 대책에도 서울 아파트 80%+ 폭등'),
    (v_pres_id, '한반도 평화 프로세스', '외교', 'partial', '남북정상회담 3회, 북미정상회담 중재, 비핵화 미달성'),
    (v_pres_id, '검찰개혁', '사법', 'partial', '공수처 출범(2021년), 검경 수사권 조정, 실효성 논란'),
    (v_pres_id, '비정규직 제로 (공공부문)', '고용', 'partial', '공공부문 정규직 전환 추진, 일부 무늬만 정규직 논란'),
    (v_pres_id, '탈원전', '에너지', 'partial', '신규 원전 건설 중단, 기존 원전 수명 연장 불허 방침')
  ON CONFLICT DO NOTHING;

  -- 논란 인사
  INSERT INTO president_appointments (president_id, appointee_name, position_appointed, issue, result, date) VALUES
    (v_pres_id, '조국', '법무부장관', '자녀 입시비리·사모펀드·감찰무마 의혹', '임명 강행→35일 만에 사퇴', '2019-09-09'),
    (v_pres_id, '추미애', '법무부장관', '아들 군 휴가 특혜 의혹, 검찰총장과 갈등', '임명 강행', '2020-01-02'),
    (v_pres_id, '김의겸', '청와대 대변인', '투기 의혹(흑석동 재개발 지역 부동산 매입)', '자진사퇴', '2019-03-08'),
    (v_pres_id, '손혜원', '국회의원/측근', '목포 부동산 투기 의혹', '당원권 정지→탈당', '2019-01-23'),
    (v_pres_id, '윤미향', '정의기억연대 대표', '위안부 기부금 횡령·보조금 부정수급 의혹', '임명 강행(비례대표)', '2020-05-01')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════
  -- 20대 윤석열 (2022–)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '윤석열';
  -- 윤석열은 이미 politicians 테이블에 존재 (migration-001)

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '2022-05-10', '2025-04-04', 20, 'impeachment', '국민의힘')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 측근 비리
  INSERT INTO president_associates (president_id, name, relation, category, criminal_stage, description, sentence, date) VALUES
    (v_pres_id, '김건희', '영부인', 'investigation', 'indicted', '도이치모터스 주가조작·명품백 수수 의혹, 기소', NULL, '2025-01-01'),
    (v_pres_id, '명태균', '정치브로커', 'criminal_conviction', 'indicted', '대통령 부부 관련 각종 로비·불법 정치자금 의혹으로 구속 기소', NULL, '2024-11-01'),
    (v_pres_id, '이종섭', '국방부장관', 'investigation', 'investigation', '해병대 채상병 순직사건 수사 외압·출국 논란', NULL, '2024-02-01'),
    (v_pres_id, '한동훈', '법무부장관/당대표', 'controversy', NULL, '검찰총장 시절 검언유착 수사 논란, 이후 당대표로서 탄핵 찬성', NULL, '2024-12-01'),
    (v_pres_id, '권성동', '대통령실 비서실장', 'investigation', 'investigation', '비상계엄 관련 내란 공모 혐의 수사', NULL, '2024-12-04'),
    (v_pres_id, '정진석', '비서실장', 'criminal_conviction', 'indicted', '비상계엄 관련 내란 공모 혐의 구속 기소', NULL, '2024-12-10'),
    (v_pres_id, '김용현', '국방부장관', 'criminal_conviction', 'indicted', '12·3 비상계엄 집행, 내란중요임무종사 구속 기소', NULL, '2024-12-08'),
    (v_pres_id, '조지호', '경찰청장', 'criminal_conviction', 'indicted', '비상계엄 시 국회 봉쇄 명령, 내란 가담 구속 기소', NULL, '2024-12-10'),
    (v_pres_id, '여인형', '국군방첩사령관', 'criminal_conviction', 'indicted', '계엄 사전 모의·국회의원 체포 명단 작성, 내란 가담 구속 기소', NULL, '2024-12-10')
  ON CONFLICT DO NOTHING;

  -- 사면 (부여)
  INSERT INTO president_pardons (president_id, direction, target_name, target_role, original_charge, original_sentence, pardon_date, pardoned_by) VALUES
    (v_pres_id, 'granted', '이명박', '전 대통령', '뇌물수수·횡령·조세포탈(다스 실소유)', '징역 17년·벌금 130억원', '2022-12-28', NULL),
    (v_pres_id, 'granted', '이재용', '삼성전자 부회장', '뇌물공여(국정농단 연루)', '징역 2년 6개월 집행유예', '2022-08-15', NULL)
  ON CONFLICT DO NOTHING;

  -- 경제
  INSERT INTO president_economy (president_id, year, gdp_growth, unemployment, inflation) VALUES
    (v_pres_id, 2022, 2.6, 2.9, 5.1),
    (v_pres_id, 2023, 1.4, 2.7, 3.6),
    (v_pres_id, 2024, 2.0, 2.8, 2.3)
  ON CONFLICT (president_id, year) DO NOTHING;

  -- 공약
  INSERT INTO president_promises (president_id, promise, category, status, detail) VALUES
    (v_pres_id, '부동산 250만호 공급', '부동산', 'broken', '공급 실적 부진, 서울 주택 가격 재상승'),
    (v_pres_id, '원전 생태계 복원', '에너지', 'partial', '신한울 3·4호기 건설 재개, 해외 원전 수출 추진'),
    (v_pres_id, '검찰·경찰 수사권 정상화', '사법', 'partial', '검수완박 시행 후 검찰 직접수사 축소 상태 유지'),
    (v_pres_id, '반도체 등 첨단산업 육성', '산업', 'partial', '반도체 특별법, 용인 반도체 클러스터 추진'),
    (v_pres_id, '의대 정원 확대', '의료', 'partial', '2025년 의대 정원 2000명 증원 결정, 의사 집단 사직 사태'),
    (v_pres_id, '50만원 청년도약계좌', '청년', 'fulfilled', '2023년 6월 출시'),
    (v_pres_id, '한미동맹 강화', '외교', 'fulfilled', '한미일 캠프데이비드 합의(2023년), 한미 핵협의그룹 출범')
  ON CONFLICT DO NOTHING;

  -- 논란 인사
  INSERT INTO president_appointments (president_id, appointee_name, position_appointed, issue, result, date) VALUES
    (v_pres_id, '이상민', '행정안전부장관', '이태원 참사 부실 대응, 탄핵소추(헌재 기각)', '임명 강행', '2022-05-13'),
    (v_pres_id, '박순애', '교육부장관', '개인 논문 표절·여행경비 유용 의혹', '자진사퇴(35일)', '2022-07-12'),
    (v_pres_id, '김승희', '보건복지부장관 후보', '논문 자기표절·가족 채용 비리 의혹', '자진사퇴(지명 철회)', '2022-08-01'),
    (v_pres_id, '이종섭', '국방부장관', '해병대 채상병 순직사건 수사 외압 의혹', '사퇴 후 주호주대사 임명 논란', '2023-09-19'),
    (v_pres_id, '한동훈', '법무부장관', '검찰총장 시절 검언유착 수사, 이첩 논란', '임명 강행', '2022-05-21'),
    (v_pres_id, '원희룡', '국토교통부장관', '전세사기 대응 부실 논란', '임명 강행', '2022-05-13'),
    (v_pres_id, '이동관', '방송통신위원장', '아들 학교폭력·언론 장악 의혹', '자진사퇴(23일)', '2023-08-31')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════
  -- 21대 이재명 (2025–)
  -- ════════════════════════════════════════════
  SELECT id INTO v_pol_id FROM politicians WHERE name = '이재명';
  -- 이재명은 이미 politicians 테이블에 존재 (migration-001)

  INSERT INTO president_profiles (politician_id, term_start, term_end, term_number, term_ended_by, party_at_time)
  VALUES (v_pol_id, '2025-06-03', NULL, 21, 'ongoing', '더불어민주당')
  ON CONFLICT (politician_id) DO NOTHING
  RETURNING id INTO v_pres_id;
  IF v_pres_id IS NULL THEN
    SELECT id INTO v_pres_id FROM president_profiles WHERE politician_id = v_pol_id;
  END IF;

  -- 공약 (2025 대선 주요 공약)
  INSERT INTO president_promises (president_id, promise, category, status, detail) VALUES
    (v_pres_id, 'AI 반도체 G3 도약', '산업', 'not_started', 'AI·반도체 분야 글로벌 3대 강국 목표'),
    (v_pres_id, '먹거리·주거·교육·돌봄 4대 기본 보장', '복지', 'not_started', '국민 기본생활 4대 분야 국가 책임 강화'),
    (v_pres_id, '전국민 25만원 지역화폐', '경제', 'not_started', '내수 진작 위한 전국민 지역화폐 지급'),
    (v_pres_id, '기본소득형 국토보유세', '부동산', 'not_started', '국토보유세 도입으로 부동산 불로소득 환수'),
    (v_pres_id, '청년 기본대출 1억원', '청년', 'not_started', '청년층 자산형성 지원 저금리 대출'),
    (v_pres_id, '한반도 평화경제', '외교', 'not_started', '남북 경제 협력 재개, 평화 프로세스 복원'),
    (v_pres_id, '검찰 개혁 완수', '사법', 'not_started', '공수처 강화, 검찰 기소독점주의 폐지 추진'),
    (v_pres_id, '기후위기 대응 2050 탄소중립', '환경', 'not_started', '재생에너지 확대, 탄소중립 이행 로드맵'),
    (v_pres_id, '의료 공공성 강화', '의료', 'not_started', '공공의료 확충, 의대 정원 합리적 조정'),
    (v_pres_id, '지방분권 강화', '행정', 'not_started', '지방재정 확충, 자치권 강화')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '역대 대통령 시드 데이터 완료';
END $$;


-- ==========================================================================
-- [3/6] seed-social-controversy.sql
-- 사회 이슈 → 정치권 확산 사례
-- ==========================================================================

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


-- ==========================================================================
-- [4/6] seed-historical-events.sql
-- 과거 주요 사건
-- ==========================================================================

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


-- ==========================================================================
-- [5/6] seed-events-2020-2025-comprehensive.sql
-- 2020~2025 사건 (상세)
-- ==========================================================================

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


-- ==========================================================================
-- [6/6] seed-events-2015-2025.sql
-- 2015~2025 사건
-- ==========================================================================

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


DO $done$
BEGIN
  RAISE NOTICE '시드 데이터 적재 완료';
END
$done$;
