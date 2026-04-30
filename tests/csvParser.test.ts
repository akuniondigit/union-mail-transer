import { describe, it, expect } from "vitest";
import { parseRecipientsCsv } from "../src/core/csvParser";

describe("parseRecipientsCsv", () => {
  it("parses name,email rows", () => {
    const r = parseRecipientsCsv(`山田 太郎,taro@example.com\n鈴木 花子,hanako@example.com`);
    expect(r.recipients).toEqual([
      { name: "山田 太郎", email: "taro@example.com" },
      { name: "鈴木 花子", email: "hanako@example.com" },
    ]);
    expect(r.errors).toEqual([]);
  });

  it("accepts header row name,email", () => {
    const r = parseRecipientsCsv(`name,email\nfoo,foo@x.com`);
    expect(r.recipients).toHaveLength(1);
    expect(r.recipients[0].email).toBe("foo@x.com");
  });

  it("accepts email-only rows", () => {
    const r = parseRecipientsCsv(`alice@example.com\nbob@example.com`);
    expect(r.recipients).toEqual([
      { name: "alice@example.com", email: "alice@example.com" },
      { name: "bob@example.com", email: "bob@example.com" },
    ]);
  });

  it("collects errors for invalid emails", () => {
    const r = parseRecipientsCsv(`ok,a@b.com\nng,not-an-email\n,b@b.com`);
    expect(r.recipients.map((x) => x.email)).toEqual(["a@b.com", "b@b.com"]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].line).toBe(2);
  });

  it("handles CRLF and quoted commas", () => {
    const r = parseRecipientsCsv(`"佐藤, 一郎","ichiro@example.com"\r\n`);
    expect(r.recipients).toEqual([{ name: "佐藤, 一郎", email: "ichiro@example.com" }]);
  });
});
