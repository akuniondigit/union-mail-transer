const PREFIX_PATTERNS: RegExp[] = [
  /^\s*(FW|FWD|RE)\s*[:：]\s*/i,
  /^\s*(転送|返信)\s*[:：]\s*/,
  /^\s*転送依頼\s*[＞>]\s*/,
];

export function cleanForwardSubject(subject: string | undefined | null): string {
  let s = (subject ?? "").trim();
  let prev = "";
  while (s !== prev) {
    prev = s;
    for (const p of PREFIX_PATTERNS) {
      s = s.replace(p, "").trim();
    }
  }
  return s;
}
