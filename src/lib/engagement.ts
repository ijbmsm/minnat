/**
 * 이슈 팔로우·댓글 공통.
 *
 * 021 마이그레이션이 프로덕션에 적용되기 전에 코드가 먼저 배포될 수 있다.
 * (019 때 같은 순서로 전 사용자가 402 를 받을 뻔했다 — STATUS.md 참고)
 * 그래서 "테이블 없음" 은 오류가 아니라 `available: false` 로 다루고,
 * 화면에서는 섹션 자체를 숨긴다.
 */

/** PostgREST: 42P01 = undefined_table, PGRST205 = 스키마 캐시에 없음 */
export function isMissingTable(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "42P01" || err.code === "PGRST205" || err.code === "PGRST202") return true;
  return /does not exist|schema cache/i.test(err.message ?? "");
}

/**
 * 표시용 이름 마스킹. 실명 인증이 아니라 카카오 닉네임이므로
 * "실명 공개" 로 오해되지 않게 앞 한 글자만 남긴다.
 */
export function maskName(nickname: string | null | undefined): string {
  const n = (nickname ?? "").trim();
  if (!n) return "익명";
  const first = [...n][0];
  return `${first}${"*".repeat(Math.min(Math.max([...n].length - 1, 1), 2))}`;
}

export type CommentSort = "top" | "new";

export interface IssueCommentDto {
  id:        string;
  maskedName: string;
  initial:   string;
  camp:      "blue" | "red" | "free";
  body:      string;
  likeCount: number;
  createdAt: string;
  likedByMe: boolean;
  mine:      boolean;
}

export interface CommentsResponse {
  available: boolean;
  total:     number;
  items:     IssueCommentDto[];
  /** 로그인 상태 — 작성 박스를 로그인 유도로 바꾸는 데 쓴다 */
  loggedIn:  boolean;
}

export const COMMENT_MAX = 500;
export const COMMENT_PAGE = 20;
