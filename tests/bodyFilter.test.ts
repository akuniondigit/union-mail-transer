import { describe, it, expect, beforeAll } from "vitest";
import { filterForwardBody } from "../src/core/bodyFilter";

beforeAll(async () => {
  const { Window } = await import("happy-dom");
  const win = new Window();
  globalThis.document = win.document as unknown as Document;
  globalThis.DOMParser = win.DOMParser as unknown as typeof DOMParser;
  globalThis.NodeFilter = win.NodeFilter as unknown as typeof NodeFilter;
  globalThis.Node = win.Node as unknown as typeof Node;
});

describe("filterForwardBody", () => {
  it("removes content above and including the marker", () => {
    const html = `
      <div>secret note from president</div>
      <p>本日のミーティング議事</p>
      <div>＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＜転送メール＞＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝</div>
      <p>本部からのお知らせ本文</p>
      <p>署名</p>
    `;
    const r = filterForwardBody(html);
    expect(r.markerFound).toBe(true);
    expect(r.html).not.toContain("secret note");
    expect(r.html).not.toContain("ミーティング");
    expect(r.html).not.toContain("転送メール");
    expect(r.html).toContain("本部からのお知らせ");
  });

  it("returns markerFound=false and full html when no marker", () => {
    const html = "<p>普通のメール</p>";
    const r = filterForwardBody(html);
    expect(r.markerFound).toBe(false);
    expect(r.html).toContain("普通のメール");
  });

  it("preserves content after marker even when all paragraphs share a wrapper container", () => {
    const html = `
      <div class="WordSection1">
        <p>HQ内部メモ 1</p>
        <p>HQ内部メモ 2</p>
        <p>＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＜転送メール＞＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝</p>
        <p>区の組合員の皆さん</p>
        <p>お疲れさまです。</p>
      </div>
    `;
    const r = filterForwardBody(html);
    expect(r.markerFound).toBe(true);
    expect(r.html).not.toContain("HQ内部メモ");
    expect(r.html).not.toContain("転送メール");
    expect(r.html).toContain("区の組合員");
    expect(r.html).toContain("お疲れさまです");
  });
});
