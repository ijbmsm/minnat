/**
 * 한 덩어리로 들어온 요약문을 읽을 수 있는 문단으로 나눈다.
 *
 * 크롤러가 넣는 summary 는 줄바꿈 없이 통으로 오는 경우가 대부분이라,
 * 상세 페이지에서 그대로 뿌리면 벽처럼 뭉쳐 보인다.
 * 이미 빈 줄이 있으면 그 경계를 존중하고, 없으면 문장 단위로 묶는다.
 *
 * 문장을 하나씩 떼어놓지 않는 이유: 두세 문장이 한 호흡으로 묶여야
 * 배경 → 전개 → 현재 상태의 흐름이 보인다. 한 문장씩 끊으면 목록처럼 읽힌다.
 */

/** 문단 하나에 넣을 최대 문장 수 */
const MAX_SENTENCES = 3;
/** 문단 하나의 목표 길이(자). 이 길이를 넘으면 문장 수가 모자라도 끊는다. */
const MAX_CHARS = 170;

/** 마침표·물음표·느낌표 뒤 공백을 문장 경계로 본다 (숫자 사이 마침표는 제외) */
const SENTENCE_BREAK = /(?<=[.!?。？！])\s+/;

export function splitParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 이미 문단이 나뉘어 있으면 그대로 쓴다
  const explicit = trimmed.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;

  // 한 줄바꿈만 있는 경우도 작성자의 의도로 본다
  const singleBreaks = trimmed.split(/\n/).map(p => p.trim()).filter(Boolean);
  if (singleBreaks.length > 1) return singleBreaks;

  const sentences = trimmed.split(SENTENCE_BREAK).map(s => s.trim()).filter(Boolean);
  if (sentences.length <= MAX_SENTENCES) return [trimmed];

  const out: string[] = [];
  let buf: string[] = [];
  let len = 0;

  for (const s of sentences) {
    buf.push(s);
    len += s.length;
    if (buf.length >= MAX_SENTENCES || len >= MAX_CHARS) {
      out.push(buf.join(' '));
      buf = [];
      len = 0;
    }
  }
  if (buf.length) {
    // 마지막 한 문장만 남으면 앞 문단에 붙인다 — 고아 줄 방지
    if (buf.length === 1 && out.length > 0) out[out.length - 1] += ' ' + buf[0];
    else out.push(buf.join(' '));
  }
  return out;
}
