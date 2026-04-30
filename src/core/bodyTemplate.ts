export interface TemplateValues {
  ku: string;
  representative: string;
}

export function applyTemplate(html: string, values: TemplateValues): string {
  let out = html;
  if (values.ku.trim()) {
    out = out.replace(/●区/g, values.ku);
  }
  if (values.representative.trim()) {
    out = out.replace(/●●/g, values.representative);
  }
  return out;
}
