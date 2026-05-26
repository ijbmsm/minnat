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
