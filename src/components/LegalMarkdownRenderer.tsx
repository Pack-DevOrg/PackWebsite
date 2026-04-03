import React from "react";

type InlinePart =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; href: string };

function parseInlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const match = remaining.match(
      /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/
    );

    if (!match || match.index === undefined) {
      parts.push({ type: "text", value: remaining });
      break;
    }

    if (match.index > 0) {
      parts.push({ type: "text", value: remaining.slice(0, match.index) });
    }

    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push({ type: "strong", value: token.slice(2, -2) });
    } else if (token.startsWith("_") && token.endsWith("_")) {
      parts.push({ type: "em", value: token.slice(1, -1) });
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push({ type: "code", value: token.slice(1, -1) });
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push({ type: "link", label: linkMatch[1], href: linkMatch[2] });
      } else {
        parts.push({ type: "text", value: token });
      }
    }

    remaining = remaining.slice(match.index + token.length);
  }

  return parts;
}

function renderInline(text: string): React.ReactNode[] {
  return parseInlineParts(text).map((part, index) => {
    switch (part.type) {
      case "strong":
        return <strong key={index}>{part.value}</strong>;
      case "em":
        return <em key={index}>{part.value}</em>;
      case "code":
        return <code key={index}>{part.value}</code>;
      case "link":
        return (
          <a
            key={index}
            href={part.href}
            target={part.href.startsWith("http") ? "_blank" : undefined}
            rel={part.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {part.label}
          </a>
        );
      default:
        return <React.Fragment key={index}>{part.value}</React.Fragment>;
    }
  });
}

type LegalMarkdownRendererProps = {
  markdown: string;
};

const LegalMarkdownRenderer: React.FC<LegalMarkdownRendererProps> = ({ markdown }) => {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      nodes.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2]);
      if (level === 1) {
        nodes.push(<h1 key={`h1-${index}`}>{content}</h1>);
      } else if (level === 2) {
        nodes.push(<h2 key={`h2-${index}`}>{content}</h2>);
      } else {
        nodes.push(<h3 key={`h3-${index}`}>{content}</h3>);
      }
      index += 1;
      continue;
    }

    const unorderedMatch = trimmed.match(/^- (.*)$/);
    if (unorderedMatch) {
      const items: React.ReactNode[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const match = current.match(/^- (.*)$/);
        if (!match) break;
        items.push(<li key={`ul-item-${index}`}>{renderInline(match[1])}</li>);
        index += 1;
      }
      nodes.push(<ul key={`ul-${index}`}>{items}</ul>);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      const items: React.ReactNode[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const match = current.match(/^\d+\.\s+(.*)$/);
        if (!match) break;
        items.push(<li key={`ol-item-${index}`}>{renderInline(match[1])}</li>);
        index += 1;
      }
      nodes.push(<ol key={`ol-${index}`}>{items}</ol>);
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;
    while (index < lines.length) {
      const current = lines[index].trim();
      if (
        !current ||
        /^#{1,3}\s+/.test(current) ||
        /^- /.test(current) ||
        /^\d+\.\s+/.test(current) ||
        /^---+$/.test(current)
      ) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }

    nodes.push(
      <p key={`p-${index}`}>{renderInline(paragraphLines.join(" "))}</p>
    );
  }

  return <>{nodes}</>;
};

export default LegalMarkdownRenderer;
