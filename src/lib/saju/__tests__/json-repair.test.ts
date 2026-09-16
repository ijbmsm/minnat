import { describe, it, expect } from 'vitest';
import { escapeRawControlChars, stripToJsonArray, parseJsonArrayLoose } from '../json-repair';

interface Sec { label?: string; title?: string; body?: string }

const NL = String.fromCharCode(10);
const TAB = String.fromCharCode(9);

describe('escapeRawControlChars', () => {
  it('문자열 안의 날 줄바꿈만 이스케이프한다', () => {
    const raw = `[${NL}  {"body": "1문단${NL}${NL}2문단"}${NL}]`;
    const fixed = escapeRawControlChars(raw);
    expect(JSON.parse(fixed)[0].body).toBe(`1문단${NL}${NL}2문단`);
  });

  it('이미 이스케이프된 \\n 은 건드리지 않는다', () => {
    const raw = '[{"body": "가\\n나"}]';
    expect(JSON.parse(escapeRawControlChars(raw))[0].body).toBe(`가${NL}나`);
  });

  it('문자열 안의 이스케이프된 따옴표를 문자열 종료로 오인하지 않는다', () => {
    const raw = `[{"body": "그는 \\"멈춰\\" 라고 말했다${NL}다음 줄"}]`;
    expect(JSON.parse(escapeRawControlChars(raw))[0].body).toBe(`그는 "멈춰" 라고 말했다${NL}다음 줄`);
  });

  it('탭도 처리한다', () => {
    const raw = `[{"body": "가${TAB}나"}]`;
    expect(JSON.parse(escapeRawControlChars(raw))[0].body).toBe(`가${TAB}나`);
  });
});

describe('stripToJsonArray', () => {
  it('코드블록과 앞말을 벗긴다', () => {
    const raw = ['네, 여기 있습니다', '```json', '[{"a":1}]', '```'].join(NL);
    expect(stripToJsonArray(raw)).toBe('[{"a":1}]');
  });
});

describe('parseJsonArrayLoose', () => {
  it('날 줄바꿈이 섞인 실제 응답 형태를 파싱한다', () => {
    const body = `첫 문단.${NL}${NL}둘째 문단.${NL}${NL}셋째 문단.`;
    const raw = ['```json', '[', `{"label":"총평","title":"멈추지 않는 태양","body":"${body}"}`, ']', '```'].join(NL);
    const out = parseJsonArrayLoose<Sec>(raw);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe('총평');
    expect(out[0].body!.split(/\n{2,}/)).toHaveLength(3);
  });

  it('max_tokens 로 절단된 배열에서 완결 객체만 살린다', () => {
    const raw = `[{"label":"총평","title":"가","body":"본문${NL}1"},{"label":"기질","title":"나","body":"본문${NL}2"},{"label":"오행","title":"다","body":"끊`;
    const out = parseJsonArrayLoose<Sec>(raw);
    expect(out).toHaveLength(2);
    expect(out[1].label).toBe('기질');
  });

  it('배열이 전혀 없으면 빈 배열', () => {
    expect(parseJsonArrayLoose<Sec>('죄송합니다, 생성할 수 없습니다.')).toEqual([]);
  });
});
