import type { ReactNode } from 'react';

const inlinePattern = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function safeLink(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(inlinePattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const key = index;
    if (match[1] !== undefined) {
      const href = safeLink(match[2]);
      parts.push(href
        ? <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline underline-offset-2 hover:text-blue-800">{match[1]}</a>
        : match[0]);
    } else if (match[3] !== undefined) {
      parts.push(<code key={key} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em] text-pink-700">{match[3]}</code>);
    } else if (match[4] !== undefined) {
      parts.push(<strong key={key} className="font-semibold text-gray-900">{inline(match[4])}</strong>);
    } else if (match[5] !== undefined) {
      parts.push(<em key={key}>{inline(match[5])}</em>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const heading = /^#{1,3}\s+/;
const bullet = /^\s*[-*]\s+/;
const numbered = /^\s*\d+\.\s+/;
const quote = /^>\s?/;
const rule = /^(?:---+|\*\*\*+)\s*$/;
const fence = /^```/;

function startsBlock(line: string): boolean {
  return heading.test(line) || bullet.test(line) || numbered.test(line)
    || quote.test(line) || rule.test(line) || fence.test(line);
}

export default function TutorialBody({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];

  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const key = i;

    if (fence.test(line)) {
      i++;
      const code: string[] = [];
      while (i < lines.length && !fence.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push(<pre key={key} className="mt-5 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm leading-relaxed text-gray-100"><code>{code.join('\n')}</code></pre>);
      continue;
    }
    if (rule.test(line)) {
      blocks.push(<hr key={key} className="my-7 border-gray-200" />);
      i++;
      continue;
    }
    if (heading.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const children = inline(line.replace(heading, ''));
      blocks.push(level === 1
        ? <h2 key={key} className="mt-8 text-xl font-bold leading-snug text-gray-900">{children}</h2>
        : level === 2
          ? <h3 key={key} className="mt-7 text-lg font-semibold leading-snug text-gray-900">{children}</h3>
          : <h4 key={key} className="mt-6 text-base font-semibold text-gray-900">{children}</h4>);
      i++;
      continue;
    }
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const pattern = ordered ? numbered : bullet;
      const items: ReactNode[] = [];
      while (i < lines.length && pattern.test(lines[i])) {
        items.push(<li key={i}>{inline(lines[i].replace(pattern, ''))}</li>);
        i++;
      }
      blocks.push(ordered
        ? <ol key={key} className="mt-4 list-decimal space-y-1.5 pl-6 text-[15px] leading-relaxed text-gray-700">{items}</ol>
        : <ul key={key} className="mt-4 list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-gray-700">{items}</ul>);
      continue;
    }
    if (quote.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && quote.test(lines[i])) quoted.push(lines[i++].replace(quote, ''));
      blocks.push(<blockquote key={key} className="mt-5 border-l-4 border-blue-300 bg-blue-50/60 py-2 pl-4 pr-3 text-[15px] leading-relaxed text-gray-700">{quoted.map((item, index) => <span key={index}>{index > 0 && <br />}{inline(item)}</span>)}</blockquote>);
      continue;
    }

    const paragraph: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) paragraph.push(lines[i++]);
    blocks.push(<p key={key} className="mt-4 text-[15px] leading-7 text-gray-700">{paragraph.map((item, index) => <span key={index}>{index > 0 && <br />}{inline(item)}</span>)}</p>);
  }

  return <div className="min-w-0 break-words">{blocks}</div>;
}
