/**
 * 사주 LLM 호출 공통 — 서버 전용.
 *
 * 결정 (SAJU_PLAN_V2 §1 ⑤): 무료·유료 구분 없이 Sonnet 5 단일. effort medium 으로 시작.
 * 시스템 프롬프트(불변부)에 prompt cache 를 걸고, 사용자별 데이터는 전부 user 메시지로 보낸다.
 * 매 호출 usage 를 로그로 남겨 실제 비용을 실측한다 (STATUS.md: 지금까지 비용은 전부 추정).
 */
import Anthropic from '@anthropic-ai/sdk';

export const SAJU_MODEL = 'claude-sonnet-5';
export type SajuEffort = 'low' | 'medium' | 'high';
export const SAJU_EFFORT: SajuEffort = 'medium';

let _client: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface SajuLLMUsage {
  input:         number;
  cacheRead:     number;
  cacheCreation: number;
  output:        number;
}

export interface SajuLLMResult {
  text:  string;
  usage: SajuLLMUsage;
}

/**
 * @param label  로그 식별자 (예: 'reading:full', 'compat')
 * @param system 불변 시스템 프롬프트 — 여기에 cache_control 이 붙는다. 사용자별 문자열을 넣지 말 것.
 */
export async function callSajuLLM(args: {
  label:     string;
  system:    string;
  user:      string;
  maxTokens: number;
  effort?:   SajuEffort;
}): Promise<SajuLLMResult> {
  const { label, system, user, maxTokens, effort = SAJU_EFFORT } = args;

  const msg = await getAnthropic().messages.create({
    model: SAJU_MODEL,
    max_tokens: maxTokens,
    output_config: { effort },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });

  const usage: SajuLLMUsage = {
    input:         msg.usage.input_tokens,
    cacheRead:     msg.usage.cache_read_input_tokens ?? 0,
    cacheCreation: msg.usage.cache_creation_input_tokens ?? 0,
    output:        msg.usage.output_tokens,
  };
  // Sonnet 5 기준 $2/$10 per 1M, 캐시 읽기 0.1배·쓰기 1.25배. 대략치 — 실제 청구는 콘솔 기준.
  const estUsd = (usage.input * 2 + usage.cacheRead * 0.2 + usage.cacheCreation * 2.5 + usage.output * 10) / 1_000_000;
  console.info(`[saju usage] ${label} model=${SAJU_MODEL} effort=${effort} in=${usage.input} cacheRead=${usage.cacheRead} cacheWrite=${usage.cacheCreation} out=${usage.output} est=$${estUsd.toFixed(4)} stop=${msg.stop_reason}`);
  if (usage.cacheRead === 0 && usage.cacheCreation === 0) {
    console.warn(`[saju usage] ${label} prompt cache 미적용 — system 이 최소 캐시 길이 미만이거나 매번 바뀜`);
  }

  const textBlock = msg.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('LLM 응답 없음');
  return { text: textBlock.text.trim(), usage };
}
