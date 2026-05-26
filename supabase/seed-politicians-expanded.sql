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
    ('이재용', v_red, '삼성전자 회장', NULL, false),
    ('정용진', v_red, '신세계그룹 회장', NULL, false),
    -- 기타 (김건희는 정치인은 아니지만 actor로 잡히므로)
    ('김건희', v_red, '전 영부인', NULL, false)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '정치인 확장 완료';
END $$;
