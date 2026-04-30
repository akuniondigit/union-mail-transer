import { Recipient, parseRecipientsCsv } from "../core/csvParser";

export type ListKey = "to-union" | "to-union-mgmt" | "cc";

export const LIST_LABELS: Record<ListKey, string> = {
  "to-union": "送信先（組合）",
  "to-union-mgmt": "送信先（組合＋経営管理職）",
  cc: "Cc",
};

interface StoredList {
  csvSource: string;
  recipients: Recipient[];
  updatedAt: string;
}

const PREFIX = "union-mail-transer:list:";

function storageKey(key: ListKey): string {
  return `${PREFIX}${key}`;
}

export function loadList(key: ListKey): StoredList | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as StoredList;
  } catch {
    return null;
  }
}

export function saveList(
  key: ListKey,
  csvSource: string
): { stored: StoredList; errors: ReturnType<typeof parseRecipientsCsv>["errors"] } {
  const { recipients, errors } = parseRecipientsCsv(csvSource);
  const stored: StoredList = {
    csvSource,
    recipients,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey(key), JSON.stringify(stored));
  return { stored, errors };
}

export function clearList(key: ListKey): void {
  localStorage.removeItem(storageKey(key));
}
