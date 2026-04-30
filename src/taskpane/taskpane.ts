import "./taskpane.css";
import { FORWARD_GUIDE_TEXT } from "../config";
import { LIST_LABELS, ListKey, loadList, saveList } from "../lists/listStore";
import { loadSettings, saveSettings, UserSettings } from "../lists/settingsStore";
import { Recipient } from "../core/csvParser";
import { filterForwardBody } from "../core/bodyFilter";
import { applyTemplate } from "../core/bodyTemplate";
import { cleanForwardSubject } from "../core/subject";
import {
  readComposeBodyHtml,
  readComposeSubject,
  setComposeBodyHtml,
  setComposeCc,
  setComposeSubject,
  setComposeTo,
} from "../outlook/itemReader";

const LIST_KEYS: ListKey[] = ["to-union", "to-union-mgmt", "cc"];
const TO_LIST_KEYS: ListKey[] = ["to-union", "to-union-mgmt"];

Office.onReady((info) => {
  if (info.host !== Office.HostType.Outlook) return;
  bindUi();
  hydrateLists();
  hydrateSettings();
});

function bindUi(): void {
  document.querySelectorAll<HTMLButtonElement>("button[data-save]").forEach((btn) => {
    btn.addEventListener("click", () => onSaveList(btn.dataset.save as ListKey));
  });
  document.getElementById("btn-save-settings")?.addEventListener("click", onSaveSettings);
  document.getElementById("btn-forward")?.addEventListener("click", onForwardClick);
}

function hydrateLists(): void {
  for (const key of LIST_KEYS) {
    const stored = loadList(key);
    const ta = document.getElementById(`csv-${key}`) as HTMLTextAreaElement | null;
    if (ta && stored) ta.value = stored.csvSource;
    updateCount(key, stored?.recipients.length ?? 0);
  }
}

function hydrateSettings(): void {
  const s = loadSettings();
  const ku = document.getElementById("setting-ku") as HTMLInputElement | null;
  const rep = document.getElementById("setting-rep") as HTMLInputElement | null;
  if (ku) ku.value = s.ku;
  if (rep) rep.value = s.representative;
}

function readSettingsFromUi(): UserSettings {
  const ku = (document.getElementById("setting-ku") as HTMLInputElement | null)?.value.trim() ?? "";
  const rep = (document.getElementById("setting-rep") as HTMLInputElement | null)?.value.trim() ?? "";
  return { ku, representative: rep };
}

function onSaveSettings(): void {
  const s = readSettingsFromUi();
  saveSettings(s);
  const note = document.getElementById("settings-status");
  if (note) {
    note.textContent = `保存しました (区: ${s.ku || "(未設定)"}, 代表委員: ${s.representative || "(未設定)"})`;
    setTimeout(() => {
      note.textContent = "";
    }, 4000);
  }
}

function onSaveList(key: ListKey): void {
  const ta = document.getElementById(`csv-${key}`) as HTMLTextAreaElement | null;
  const errEl = document.getElementById(`err-${key}`);
  if (!ta) return;
  const { stored, errors } = saveList(key, ta.value);
  updateCount(key, stored.recipients.length);
  if (errEl) {
    errEl.textContent = errors.length ? `${errors.length} 行スキップ (例: L${errors[0].line})` : "";
  }
  setStatus(`${LIST_LABELS[key]} を保存しました (${stored.recipients.length} 件)`, "ok");
}

function updateCount(key: ListKey, n: number): void {
  const el = document.getElementById(`count-${key}`);
  if (el) el.textContent = `件数: ${n}`;
}

function getSelectedToList(): ListKey {
  const sel = document.querySelector<HTMLInputElement>('input[name="to-list"]:checked');
  const v = sel?.value as ListKey | undefined;
  return v && TO_LIST_KEYS.includes(v) ? v : "to-union";
}

function getCurrentToRecipients(): Recipient[] {
  return loadList(getSelectedToList())?.recipients ?? [];
}

function getCurrentCcRecipients(): Recipient[] {
  return loadList("cc")?.recipients ?? [];
}

async function onForwardClick(): Promise<void> {
  const btn = document.getElementById("btn-forward") as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = true;
  setStatus("処理中...", "ok");
  setHint("");

  try {
    const settings = readSettingsFromUi();
    saveSettings(settings);

    const to = getCurrentToRecipients();
    if (to.length === 0) {
      throw new Error(`${LIST_LABELS[getSelectedToList()]} が空です。リストを保存してください`);
    }
    const cc = getCurrentCcRecipients();

    const [bodyHtml, currentSubject] = await Promise.all([
      readComposeBodyHtml(),
      readComposeSubject(),
    ]);

    const filtered = filterForwardBody(bodyHtml);
    const newSubject = cleanForwardSubject(currentSubject);

    if (filtered.markerFound) {
      const substituted = applyTemplate(filtered.html, settings);
      await setComposeBodyHtml(substituted);
    }
    await setComposeSubject(newSubject);
    await setComposeTo(to);
    await setComposeCc(cc);

    let msg = `更新 OK (To ${to.length} 件 / CC ${cc.length} 件)`;
    if (!filtered.markerFound) msg += " ※マーカー未検出のため本文は無加工（書式維持）";
    if (!settings.ku || !settings.representative) {
      msg += " ※設定（区/代表委員名）が未入力のためプレースホルダ未置換";
    }
    setStatus(msg, "ok");
    setHint(FORWARD_GUIDE_TEXT);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    setStatus(`エラー: ${message}`, "error");
  } finally {
    btn.disabled = false;
  }
}

function setStatus(text: string, kind: "ok" | "error" = "ok"): void {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = text;
  el.className = `status ${kind}`;
}

function setHint(text: string): void {
  const el = document.getElementById("hint");
  if (el) el.textContent = text;
}
