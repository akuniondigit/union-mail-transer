export interface Recipient {
  name: string;
  email: string;
}

export interface CsvParseResult {
  recipients: Recipient[];
  errors: { line: number; raw: string; reason: string }[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRecipientsCsv(csv: string): CsvParseResult {
  const recipients: Recipient[] = [];
  const errors: CsvParseResult["errors"] = [];
  if (!csv) return { recipients, errors };

  const lines = csv.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const line = raw.trim();
    if (!line) return;
    if (lineNo === 1 && /name\s*,\s*(e-?mail|address)/i.test(line)) return;

    const cells = splitCsvLine(line);
    if (cells.length < 1) {
      errors.push({ line: lineNo, raw, reason: "empty" });
      return;
    }

    let name = "";
    let email = "";
    if (cells.length === 1) {
      email = cells[0];
    } else {
      name = cells[0];
      email = cells[1];
    }
    name = name.trim();
    email = email.trim();

    if (!EMAIL_REGEX.test(email)) {
      errors.push({ line: lineNo, raw, reason: `invalid email: "${email}"` });
      return;
    }
    recipients.push({ name: name || email, email });
  });

  return { recipients, errors };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuote = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out;
}
