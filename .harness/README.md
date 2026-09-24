# .harness

에이전트와 사람이 **작업 전에 읽는** 규칙 모음.

```
constraints.md     제약 정본. M-01 ~
```

엔진은 `scripts/harness/` 에 있다.

```bash
node scripts/harness/run.mjs                      # 전체
node scripts/harness/run.mjs --check score-parity # 하나만
node scripts/harness/run.mjs --json               # 기계용
```

## 어디서 왔나

charzing 의 하네스에서 **엔진만** 떠왔다 (2026-09-25). 검사는 처음부터 새로 썼다 —
남의 검사는 그 코드베이스의 함수 이름과 폴더 구조에 묶여 있다.

| | 파일 | 고쳤나 |
| --- | --- | --- |
| 엔진 | `run.mjs` · `lib/findings.mjs` · `lib/audit.mjs` · `checks/index.mjs` | 안 고침 |
| 엔진 | `hook-edit.mjs` | **1줄** — 표식 디렉터리 이름이 프로젝트명으로 박혀 있어 `ROOT` 해시로 바꿨다 (주석 3줄은 charzing 이력 서술이라 일반화) |
| 설정 | `harness.config.mjs` | 전부 새로 씀 |
| 규범 | `checks/*.mjs` · `constraints.md` · `baseline.json` | 전부 새로 씀 |

**엔진이 언어를 모른다는 게 실제로 확인됐다.** 대상이 파이썬 리포인데 엔진은 한 줄도
달라지지 않았다. 유일하게 고친 줄도 언어와 무관한 프로젝트명 하드코딩이었다.

## 번호 체계

| 표기 | 뜻 | 어디에 |
| --- | --- | --- |
| `M-01` ~ | **제약.** 두 자리 고정 | `constraints.md` |

charzing 은 `C-NN` 을 쓴다. 두 리포를 오갈 때 섞이지 않게 접두를 다르게 뒀다.

## 규칙

- **규범 문장은 한 곳에만 쓴다.** 복제가 곧 드리프트다
- "반드시 X" 를 적을 거면 **확인할 검사를 같이 만든다.** 못 만들면 "권장" 으로 낮춘다
- **검사를 한 번에 다 켜지 않는다.** 하나 켜고 → 오늘 안 고칠 것만 사유·기한을 적어
  baseline 에 등록 → 다음 검사
- **`until` 에 `null` 이나 `TRIAGE` 를 쓰지 않는다.** 정할 수 없으면 가까운 날짜를 박는다.
  이른 날짜는 자기교정된다 — CI 가 빨개지면 고치든 미루든 어느 쪽이든 결정이 일어난다.
  charzing 은 `--update-baseline` 을 일괄로 돌려 48건이 기한 없이 들어갔고, 앉은자리에
  48건을 분류할 사람은 없었다
- **검사를 만들기 전에 센다.** 잡으려는 패턴이 리포에 몇 번 나오는지부터 확인한다
- **통과를 믿지 않는다.** 값을 일부러 어긋낸 사본으로 한 번 돌려본다 (아래)

## 반대 방향 확인

검사가 내는 "통과" 가 진짜인지, 아무것도 안 본 건지 가르는 유일한 방법이다.

```bash
mkdir -p /tmp/fake-crawler
sed 's/"조선일보": "conservative"/"조선일보": "center"/' \
  ../minnat-crawler/config.py > /tmp/fake-crawler/config.py
cp ../minnat-crawler/scorer.py ../minnat-crawler/event_manager.py /tmp/fake-crawler/
HARNESS_CRAWLER_ROOT=/tmp/fake-crawler node scripts/harness/run.mjs
```

심어둔 드리프트가 안 잡히면 검사가 헛돌고 있는 것이다.

> 실제로 이 절차가 버그를 잡았다 (2026-09-25). 값 비교가
> `String(Number(a)) !== String(Number(b)) && ...` 였는데, 문자열이면 앞 항이
> `'NaN' !== 'NaN'` = false 라 `&&` 가 단락돼 **문자열 값은 영원히 통과했다.**
> `MEDIA_LEAN` 에 진영을 바꿔 심어도 안 잡혔다.

## 지금 돌아가는 것 (2026-09-25)

| | |
| --- | --- |
| 검사 | 1개 — `score-parity` (M-01) |
| 이빨 | 있다. 실제 위반 3건을 잡았고 baseline 기한은 2026-10-09 |
| 편집 훅 | 등록됨 — `.claude/settings.json` |
| CI | `continue-on-error` (관측 단계). 형제 리포를 나란히 체크아웃한다 |

## 다음

1. baseline 3건 해소 — 개편 5단계(D)에서 크롤러 점수식을 웹에 맞춘다 (`until: 2026-10-09`)
2. CI `continue-on-error` 해제 — 1번이 끝나면
3. 두 번째 검사 — 후보는 `constraints.md` 의 "아직 검사가 없는 것"
4. charzing 세션에 이식 결과 회신 — 엔진에서 고친 줄 목록 (위 표)
