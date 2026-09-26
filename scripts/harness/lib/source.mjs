// 소스에서 **코드만** 남긴다.
//
// "이 호출이 있는가" 를 보는 검사는 주석에 적힌 이름도 호출로 센다.
// 2026-09-26 실측: `recalculate_event_score` 에서 위임을 걷어내고
// `# score_core() 를 쓰지 않는다` 라고 적어두니 검사가 **통과했다.**
// 진짜 코드에서도 누가 그렇게 적으면 그 함수는 영원히 통과한다.
//
// 방향은 이렇다. 주석을 걷어내면
//   있어야 하는 표식(위임·인증)은 **더 엄격**해진다 — 주석으로 때울 수 없다
//   없어야 하는 표식(금지 호출)은 **느슨**해진다 — 주석에 적힌 건 위반이 아니다
// 둘 다 옳은 방향이다.
//
// 줄 번호를 보존한다. 주석 자리를 공백으로 바꿀 뿐 줄을 지우지 않는다 —
// finding 의 line 이 어긋나면 사람이 파일을 못 찾는다.
//
// charzing 쪽 `withoutComments()` 와 같은 발상이고 문법만 파이썬이다
// (`//` → `#`, 템플릿 리터럴 → 삼중 따옴표).

/** 한 줄의 주석·문자열을 공백으로 지우되 길이를 유지한다 */
function blankSpan(line, from, to) {
  return line.slice(0, from) + " ".repeat(to - from) + line.slice(to);
}

/**
 * 파이썬 소스에서 `#` 주석을 지운다. 문자열 안의 `#`(URL 등)는 남긴다.
 *
 * 삼중 따옴표 블록은 여기서 건드리지 않는다 — 독스트링을 보는 검사가 있기 때문이다
 * (`stripPyDocstrings` 를 따로 쓴다).
 */
export function stripPyComments(src) {
  const out = [];
  let triple = null; // 열려 있는 삼중 따옴표 종류

  for (let raw of String(src).split("\n")) {
    let line = raw;
    let i = 0;
    let quote = null; // 한 줄 안에서 열린 따옴표

    while (i < line.length) {
      const three = line.slice(i, i + 3);

      if (triple) {
        // 삼중 따옴표 안이다. 닫히는 곳까지 건너뛴다
        if (three === triple) { triple = null; i += 3; continue; }
        i++;
        continue;
      }

      if (!quote && (three === '"""' || three === "'''")) {
        triple = three;
        i += 3;
        continue;
      }

      const ch = line[i];

      if (quote) {
        if (ch === "\\") { i += 2; continue; }
        if (ch === quote) quote = null;
        i++;
        continue;
      }

      if (ch === '"' || ch === "'") { quote = ch; i++; continue; }

      if (ch === "#") {
        // 여기서부터 줄 끝까지가 주석이다
        line = blankSpan(line, i, line.length);
        break;
      }

      i++;
    }

    out.push(line);
  }

  return out.join("\n");
}

/**
 * 삼중 따옴표 블록(독스트링)까지 지운다. 줄 수는 유지한다.
 *
 * 위임 여부처럼 **코드만** 봐야 하는 검사에 쓴다. 독스트링에 함수 이름이
 * 적혀 있으면(대개 적혀 있다) 호출로 세어 버린다.
 */
export function stripPyDocstrings(src) {
  const lines = String(src).split("\n");
  const out = [];
  let triple = null;

  for (const raw of lines) {
    let line = raw;
    let i = 0;
    let kept = "";

    while (i < line.length) {
      const three = line.slice(i, i + 3);
      if (triple) {
        if (three === triple) { triple = null; i += 3; kept += "   "; continue; }
        kept += " ";
        i++;
        continue;
      }
      if (three === '"""' || three === "'''") {
        triple = three;
        i += 3;
        kept += "   ";
        continue;
      }
      kept += line[i];
      i++;
    }
    out.push(kept);
  }

  return out.join("\n");
}

/** 주석과 독스트링을 모두 걷어낸 코드. "이 호출이 있는가" 검사용 */
export function pyCodeOnly(src) {
  return stripPyDocstrings(stripPyComments(src));
}
