/**
 * LLM 이 돌려준 JSON 배열을 파싱 가능한 형태로 되돌린다.
 *
 * 풀이 본문은 빈 줄로 나뉜 여러 문단이라, 모델이 문자열 안에 \n 대신 진짜 줄바꿈을
 * 그대로 써서 보내는 일이 잦다. JSON 스펙상 문자열 안의 제어문자는 반드시 이스케이프
 * 되어야 하므로 JSON.parse 가 "Bad control character in string literal" 로 죽는다.
 * 여기서 문자열 안쪽의 제어문자만 골라 이스케이프한다. 구조(따옴표·쉼표)는 건드리지 않는다.
 */
export function escapeRawControlChars(src: string): string {
  let out = '';
  let inString = false;
  let escaped  = false;

  for (const ch of src) {
    if (escaped) { out += ch; escaped = false; continue; }
    if (inString && ch === '\\') { out += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }

    if (inString) {
      const code = ch.codePointAt(0) ?? 0;
      if (code < 0x20) {
        out += ch === '\n' ? '\\n'
             : ch === '\r' ? '\\r'
             : ch === '\t' ? '\\t'
             : '\\u' + code.toString(16).padStart(4, '0');
        continue;
      }
    }
    out += ch;
  }
  return out;
}

/** 코드블록·앞뒤 설명을 벗겨 JSON 배열 시작부터 반환한다. */
export function stripToJsonArray(raw: string): string {
  let cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const start = cleaned.indexOf('[');
  if (start >= 0) cleaned = cleaned.slice(start);
  return cleaned;
}

/**
 * 절단된 JSON 배열에서 완결된 객체만 살린다.
 * max_tokens 초과로 중간에 끊긴 경우 마지막으로 닫힌 '}' 까지만 취하고 배열을 닫는다.
 */
export function salvageTruncatedArray<T>(s: string): T[] {
  const lastClose = s.lastIndexOf('}');
  if (lastClose < 0) return [];
  try {
    const arr = JSON.parse(escapeRawControlChars(s.slice(0, lastClose + 1) + ']')) as T[];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** stripToJsonArray → 제어문자 복구 → JSON.parse. 실패 시 절단 복구까지 시도한다. */
export function parseJsonArrayLoose<T>(raw: string): T[] {
  const cleaned = escapeRawControlChars(stripToJsonArray(raw));
  try {
    const parsed = JSON.parse(cleaned) as T[];
    if (Array.isArray(parsed)) return parsed;
  } catch { /* 아래 절단 복구로 */ }
  return salvageTruncatedArray<T>(cleaned);
}
