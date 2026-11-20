export interface LexicalNodeLike {
  type?: string;
  text?: string;
  format?: number;
  tag?: string;
  listType?: string;
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  children?: LexicalNodeLike[];
}

export interface LexicalDocumentLike {
  root?: {
    children?: LexicalNodeLike[];
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeHref(url: string): string {
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return "#";
}

function renderNode(node: LexicalNodeLike): string {
  const type = String(node.type || "");
  if (type === "text") {
    let out = escapeHtml(String(node.text || ""));
    const fmt = typeof node.format === "number" ? node.format : 0;
    if (fmt & 1) out = `<strong>${out}</strong>`;
    if (fmt & 2) out = `<em>${out}</em>`;
    if (fmt & 8) out = `<u>${out}</u>`;
    if (fmt & 16) out = `<code>${out}</code>`;
    return out;
  }
  if (type === "linebreak") return "<br />";

  const children = Array.isArray(node.children)
    ? node.children.map(renderNode).join("")
    : "";

  if (type === "paragraph") {
    return children.trim() ? `<p>${children}</p>` : "";
  }
  if (type === "heading") {
    const allowed = new Set(["h2", "h3", "h4"]);
    const tag = allowed.has(String(node.tag || "")) ? String(node.tag) : "h2";
    return `<${tag}>${children}</${tag}>`;
  }
  if (type === "quote") {
    return `<blockquote>${children}</blockquote>`;
  }
  if (type === "list") {
    const tag = node.listType === "number" ? "ol" : "ul";
    return `<${tag}>${children}</${tag}>`;
  }
  if (type === "listitem") {
    return `<li>${children}</li>`;
  }
  if (type === "link" || type === "autolink") {
    const rawHref = node.fields?.url || node.url || "#";
    const href = escapeHtml(sanitizeHref(rawHref));
    const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${target}>${children}</a>`;
  }
  return children;
}

export function isLexicalDoc(val: unknown): val is LexicalDocumentLike {
  return (
    typeof val === "object" &&
    val !== null &&
    "root" in val &&
    typeof (val as LexicalDocumentLike).root === "object" &&
    (val as LexicalDocumentLike).root !== null &&
    Array.isArray((val as LexicalDocumentLike).root?.children)
  );
}

export function lexicalToHtmlString(val: unknown): string {
  if (typeof val === "string") return val;
  if (!isLexicalDoc(val)) return "";
  return (val.root?.children ?? [])
    .map(renderNode)
    .filter(Boolean)
    .join("\n");
}

export function lexicalToPlainText(val: unknown): string {
  const html = lexicalToHtmlString(val);
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pure-JS Lexical JSON builder for Node CLI scripts (like seed-stage-b.ts)
 * where browser DOMParser is not available.
 */
export function buildLexicalFromSections(
  sections: Array<{ title?: string; text: string }>
): LexicalDocumentLike {
  const children: LexicalNodeLike[] = [];

  for (const sec of sections) {
    if (sec.title?.trim()) {
      children.push({
        type: "heading",
        tag: "h2",
        children: [
          {
            type: "text",
            text: sec.title.trim(),
            format: 0,
            ...( { detail: 0, mode: "normal", style: "", version: 1 } as object ),
          },
        ],
        ...( { direction: "ltr", format: "", indent: 0, version: 1 } as object ),
      });
    }
    const paragraphs = sec.text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const para of paragraphs) {
      children.push({
        type: "paragraph",
        children: [
          {
            type: "text",
            text: para,
            format: 0,
            ...( { detail: 0, mode: "normal", style: "", version: 1 } as object ),
          },
        ],
        ...( { direction: "ltr", format: "", indent: 0, textFormat: 0, textStyle: "", version: 1 } as object ),
      });
    }
  }

  return {
    root: {
      children,
      ...( { type: "root", direction: "ltr", format: "", indent: 0, version: 1 } as object ),
    },
  };
}
