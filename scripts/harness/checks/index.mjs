// 검사 목록 단일 소스.
//
// run.mjs 와 hook-edit.mjs 가 각자 배열을 들고 있다가 한쪽만 갱신돼
// 훅이 새 검사를 못 보는 일이 charzing 에서 실제로 있었다 (2026-09-22).
//
// ⚠️ 한 번에 다 켜지 않는다. 하나 켜고 → 오늘 안 고칠 것만 사유·기한을 적어
//    baseline 에 등록 → 다음 검사. charzing 은 --update-baseline 을 일괄로 돌려
//    48건이 '미분류'로 들어갔고, 앉은자리에 48건을 분류할 사람은 없었다.
export const CHECKS = ['score-parity'];
