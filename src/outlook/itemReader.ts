import { Recipient } from "../core/csvParser";

type ComposeItem = Office.MessageCompose;

function getComposeItem(): ComposeItem {
  const item = Office.context.mailbox.item as ComposeItem | undefined;
  if (!item) throw new Error("メールが選択されていません");
  if (!item.to || !item.body || !item.subject) {
    throw new Error("このアドインは転送/返信/新規作成の編集画面で使用してください");
  }
  return item;
}

export function readComposeBodyHtml(): Promise<string> {
  const item = getComposeItem();
  return new Promise((resolve, reject) => {
    item.body.getAsync(Office.CoercionType.Html, (r) => {
      if (r.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(`本文取得失敗: ${r.error.message}`));
        return;
      }
      resolve(r.value ?? "");
    });
  });
}

export function readComposeSubject(): Promise<string> {
  const item = getComposeItem();
  return new Promise((resolve, reject) => {
    item.subject.getAsync((r) => {
      if (r.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(`件名取得失敗: ${r.error.message}`));
        return;
      }
      resolve(r.value ?? "");
    });
  });
}

export function setComposeBodyHtml(html: string): Promise<void> {
  const item = getComposeItem();
  return new Promise((resolve, reject) => {
    item.body.setAsync(html, { coercionType: Office.CoercionType.Html }, (r) => {
      if (r.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(`本文書き込み失敗: ${r.error.message}`));
        return;
      }
      resolve();
    });
  });
}

export function setComposeSubject(subject: string): Promise<void> {
  const item = getComposeItem();
  return new Promise((resolve, reject) => {
    item.subject.setAsync(subject, (r) => {
      if (r.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(`件名書き込み失敗: ${r.error.message}`));
        return;
      }
      resolve();
    });
  });
}

export function setComposeTo(recipients: Recipient[]): Promise<void> {
  return setComposeRecipients("to", recipients);
}

export function setComposeCc(recipients: Recipient[]): Promise<void> {
  return setComposeRecipients("cc", recipients);
}

function setComposeRecipients(field: "to" | "cc", recipients: Recipient[]): Promise<void> {
  const item = getComposeItem();
  const target = field === "to" ? item.to : item.cc;
  const mapped = recipients.map((r) => ({
    displayName: r.name || r.email,
    emailAddress: r.email,
  }));
  return new Promise((resolve, reject) => {
    target.setAsync(mapped, (r) => {
      if (r.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(`${field.toUpperCase()} 書き込み失敗: ${r.error.message}`));
        return;
      }
      resolve();
    });
  });
}
