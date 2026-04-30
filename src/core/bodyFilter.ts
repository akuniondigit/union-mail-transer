const MARKER_REGEX = /[＝=]{3,}\s*[＜<]\s*転送メール\s*[＞>]\s*[＝=]{3,}/;

export interface FilterResult {
  html: string;
  markerFound: boolean;
}

export function filterForwardBody(html: string): FilterResult {
  if (!html) return { html: "", markerFound: false };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  const node = findMarkerNode(body);
  if (!node) return { html, markerFound: false };

  removeNodeAndPrior(node);

  const headStyles = Array.from(doc.head.querySelectorAll("style"))
    .map((s) => s.outerHTML)
    .join("");

  return { html: headStyles + body.innerHTML, markerFound: true };
}

function findMarkerNode(root: Node): Node | null {
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.textContent && MARKER_REGEX.test(root.textContent)) {
      return ascendToBlock(root);
    }
    return null;
  }
  const children = root.childNodes;
  for (let i = 0; i < children.length; i++) {
    const hit = findMarkerNode(children[i]);
    if (hit) return hit;
  }
  return null;
}

function ascendToBlock(node: Node): Node {
  const blockTags = new Set(["DIV", "P", "BLOCKQUOTE", "LI", "TR", "TABLE", "PRE"]);
  let cur: Node | null = node;
  while (cur && cur.parentNode) {
    if (cur.nodeType === Node.ELEMENT_NODE && blockTags.has((cur as Element).tagName)) {
      return cur;
    }
    cur = cur.parentNode;
  }
  return node;
}

function removeNodeAndPrior(target: Node): void {
  let cur: Node = target;
  while (cur.parentNode) {
    const parent: Node = cur.parentNode;
    let sib: Node | null = cur.previousSibling;
    while (sib) {
      const toRemove = sib;
      sib = sib.previousSibling;
      parent.removeChild(toRemove);
    }
    if (parent === document.body || (parent as Element).tagName === "BODY") break;
    cur = parent;
  }
  target.parentNode?.removeChild(target);
}
