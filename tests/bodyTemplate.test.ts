import { describe, it, expect } from "vitest";
import { applyTemplate } from "../src/core/bodyTemplate";

describe("applyTemplate", () => {
  it("substitutes ●区 with ku value and ●● with representative", () => {
    const html = "<p>●区の組合員の皆さん　／　代表委員　●●</p>";
    const out = applyTemplate(html, { ku: "24区", representative: "山田 太郎" });
    expect(out).toBe("<p>24区の組合員の皆さん　／　代表委員　山田 太郎</p>");
  });

  it("replaces all occurrences", () => {
    const html = "<p>●区A</p><p>●区B</p><p>●●1</p><p>●●2</p>";
    const out = applyTemplate(html, { ku: "24区", representative: "X" });
    expect(out).toBe("<p>24区A</p><p>24区B</p><p>X1</p><p>X2</p>");
  });

  it("leaves placeholders untouched when settings are empty", () => {
    const html = "<p>●区の組合員　／　代表委員　●●</p>";
    const out = applyTemplate(html, { ku: "", representative: "" });
    expect(out).toBe(html);
  });

  it("only substitutes ●● when representative is set", () => {
    const html = "<p>●区　代表委員　●●</p>";
    const out = applyTemplate(html, { ku: "24区", representative: "" });
    expect(out).toBe("<p>24区　代表委員　●●</p>");
  });
});
