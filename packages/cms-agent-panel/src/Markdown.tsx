// ============================================================
// Markdown — Lightweight zero-dependency markdown renderer
// Handles: bold, italic, inline code, code blocks, headings,
//          unordered/ordered lists, links, and paragraphs.
// ============================================================

import React from "react";

/**
 * Parse inline markdown tokens (bold, italic, code, links) into React elements.
 */
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Regex matches, in order of priority:
  // 1. inline code: `code`
  // 2. bold+italic: ***text*** or ___text___
  // 3. bold: **text** or __text__
  // 4. italic: *text* or _text_
  // 5. links: [label](url)
  const inlineRe =
    /(`[^`]+`)|(\*{3}[^*]+?\*{3}|_{3}[^_]+?_{3})|(\*{2}[^*]+?\*{2}|_{2}[^_]+?_{2})|(\*[^*]+?\*|_[^_]+?_)|(\[[^\]]+?\]\([^)]+?\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = inlineRe.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const raw = match[0];
    if (match[1]) {
      // inline code
      nodes.push(
        <code key={key++} className="cap-md-code">
          {raw.slice(1, -1)}
        </code>
      );
    } else if (match[2]) {
      // bold + italic
      nodes.push(
        <strong key={key++} className="cap-md-bold">
          <em className="cap-md-italic">{raw.slice(3, -3)}</em>
        </strong>
      );
    } else if (match[3]) {
      // bold
      nodes.push(
        <strong key={key++} className="cap-md-bold">
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (match[4]) {
      // italic
      nodes.push(
        <em key={key++} className="cap-md-italic">
          {raw.slice(1, -1)}
        </em>
      );
    } else if (match[5]) {
      // link
      const linkMatch = raw.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        nodes.push(
          <a
            key={key++}
            className="cap-md-link"
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + raw.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders a markdown string as structured React elements.
 * Block-level parsing: code fences, headings, lists, paragraphs.
 */
export function Markdown({ content, className }: MarkdownProps) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // --- Fenced code block ---
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <pre key={key++} className="cap-md-pre">
          <code className={lang ? `cap-md-codeblock cap-md-lang-${lang}` : "cap-md-codeblock"}>
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      continue;
    }

    // --- Heading ---
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      blocks.push(
        <Tag key={key++} className={`cap-md-heading cap-md-h${level}`}>
          {parseInline(headingMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    // --- Horizontal rule ---
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="cap-md-hr" />);
      i++;
      continue;
    }

    // --- Unordered list ---
    if (/^[\s]*[-*+]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^[\s]*[-*+]\s+/, "");
        items.push(<li key={key++}>{parseInline(itemText)}</li>);
        i++;
      }
      blocks.push(
        <ul key={key++} className="cap-md-ul">
          {items}
        </ul>
      );
      continue;
    }

    // --- Ordered list ---
    if (/^[\s]*\d+[.)]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\s]*\d+[.)]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^[\s]*\d+[.)]\s+/, "");
        items.push(<li key={key++}>{parseInline(itemText)}</li>);
        i++;
      }
      blocks.push(
        <ol key={key++} className="cap-md-ol">
          {items}
        </ol>
      );
      continue;
    }

    // --- Blank line ---
    if (line.trim() === "") {
      i++;
      continue;
    }

    // --- Paragraph (collect consecutive non-empty, non-special lines) ---
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("```") &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^[\s]*[-*+]\s+/.test(lines[i]) &&
      !/^[\s]*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(
        <p key={key++} className="cap-md-p">
          {parseInline(paraLines.join("\n"))}
        </p>
      );
    }
  }

  return <div className={`cap-md ${className || ""}`}>{blocks}</div>;
}
