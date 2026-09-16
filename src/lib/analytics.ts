"use client";

import { sendGAEvent } from "@next/third-parties/google";

/** 사주 퍼널 이벤트 이름 — GA4 DebugView 에서 이 이름으로 필터한다. */
export type SajuEvent =
  | 'saju_form_start'
  | 'saju_form_submit'
  | 'saju_preview_view'
  | 'saju_login_prompt'
  | 'saju_reading_view'
  | 'saju_share_click'
  | 'saju_credit_zero'
  | 'saju_invite_create'
  | 'saju_invite_accept';

type Primitive = string | number | boolean;

/** 실패해도 UI 를 막지 않는다. GA 미설정(개발)에서는 no-op. */
export function track(event: SajuEvent, params: Record<string, Primitive> = {}): void {
  try {
    if (typeof window === 'undefined') return;
    sendGAEvent('event', event, params);
  } catch { /* ignore */ }
}
