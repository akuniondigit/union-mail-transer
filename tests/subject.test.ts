import { describe, it, expect } from "vitest";
import { cleanForwardSubject } from "../src/core/subject";

describe("cleanForwardSubject", () => {
  it("strips FW: 転送依頼＞ prefix", () => {
    expect(cleanForwardSubject("FW: 転送依頼＞護身術セミナーの参加者募集開始")).toBe(
      "護身術セミナーの参加者募集開始"
    );
  });

  it("strips Fw: from Outlook forward and FW: from HQ both", () => {
    expect(cleanForwardSubject("Fw: FW: 転送依頼＞護身術セミナー")).toBe("護身術セミナー");
  });

  it("strips repeated 転送依頼＞ tokens", () => {
    expect(cleanForwardSubject("転送依頼＞転送依頼＞お知らせ")).toBe("お知らせ");
  });

  it("handles half-width angle bracket variant", () => {
    expect(cleanForwardSubject("FW: 転送依頼>お知らせ")).toBe("お知らせ");
  });

  it("returns empty string for null/empty input", () => {
    expect(cleanForwardSubject("")).toBe("");
    expect(cleanForwardSubject(null)).toBe("");
  });

  it("leaves a clean subject untouched", () => {
    expect(cleanForwardSubject("護身術セミナー")).toBe("護身術セミナー");
  });

  it("strips RE: as well", () => {
    expect(cleanForwardSubject("RE: お知らせ")).toBe("お知らせ");
  });
});
