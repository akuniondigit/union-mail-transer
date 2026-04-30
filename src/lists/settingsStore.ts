export interface UserSettings {
  ku: string;
  representative: string;
}

const KEY = "union-mail-transer:settings";

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ku: "", representative: "" };
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ku: parsed.ku ?? "", representative: parsed.representative ?? "" };
  } catch {
    return { ku: "", representative: "" };
  }
}

export function saveSettings(s: UserSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
