"use client";

/**
 * Converts a Markdown or HTML string to a Payload-compatible Lexical editor state JSON.
 * Markdown is first converted to HTML via `marked`, then parsed with @lexical/html.
 */

import { marked } from "marked";
import {
  $getRoot,
  $insertNodes,
  createEditor,
} from "@payloadcms/richtext-lexical/lexical";
import {
  HeadingNode,
  QuoteNode,
} from "@payloadcms/richtext-lexical/lexical/rich-text";
import {
  AutoLinkNode,
  LinkNode,
} from "@payloadcms/richtext-lexical/lexical/link";
import {
  ListItemNode,
  ListNode,
} from "@payloadcms/richtext-lexical/lexical/list";
import { $generateNodesFromDOM } from "@payloadcms/richtext-lexical/lexical/html";

function stripLinks(html: string): string {
  return html.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
}

function stripCodeFences(text: string): string {
  return text.replace(/^```[\w]*\s*/i, "").replace(/\s*```$/i, "").trim();
}

function isMarkdown(text: string): boolean {
  return /^#{1,6}\s|^\*\*|^__|\*\*|\[.+\]\(.+\)|^[-*]\s|^\d+\.\s/m.test(text);
}

export function htmlToLexical(input: string): object {
  const stripped = stripCodeFences(input);
  const html = isMarkdown(stripped)
    ? (marked.parse(stripped, { async: false }) as string)
    : stripped;
  const clean = stripLinks(html);

  const editor = createEditor({
    nodes: [HeadingNode, QuoteNode, LinkNode, AutoLinkNode, ListNode, ListItemNode],
    onError: () => {},
  });

  const parser = new DOMParser();
  const dom = parser.parseFromString(clean, "text/html");

  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      const nodes = $generateNodesFromDOM(editor, dom);
      $insertNodes(nodes);
    },
    { discrete: true }
  );

  return editor.getEditorState().toJSON();
}
