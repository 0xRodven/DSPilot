export type ParsedHtmlCell = {
  tag: "th" | "td";
  text: string;
  html: string;
  attributes: Record<string, string>;
};

export type ParsedHtmlRow = {
  cells: ParsedHtmlCell[];
};

export type ParsedHtmlTable = {
  rows: ParsedHtmlRow[];
};

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();
    if (normalized in ENTITY_MAP) {
      return ENTITY_MAP[normalized];
    }

    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return match;
  });
}

export function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function parseLocalizedAmazonNumber(value: string) {
  const cleaned = value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, "")
    .replace(/%$/u, "")
    .trim();

  if (!cleaned || cleaned === "-" || cleaned === "--" || cleaned === "--" || cleaned === "Aucunedonnée") {
    return undefined;
  }

  let normalized = cleaned;
  if (normalized.includes(",") && !normalized.includes(".")) {
    const lastChunk = normalized.split(",").at(-1) || "";
    normalized = lastChunk.length === 3 ? normalized.replaceAll(",", "") : normalized.replace(",", ".");
  } else {
    normalized = normalized.replaceAll(",", "");
  }

  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function parseAttributes(raw: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;

  for (const match of raw.matchAll(attributePattern)) {
    const key = match[1]?.toLowerCase();
    const value = decodeHtmlEntities(match[3] ?? match[4] ?? "");
    if (key) {
      attributes[key] = value;
    }
  }

  return attributes;
}

export function extractFirstTable(html: string, matcher?: (tableHtml: string) => boolean): ParsedHtmlTable | null {
  const tablePattern = /<table\b[^>]*>[\s\S]*?<\/table>/gi;

  for (const match of html.matchAll(tablePattern)) {
    const tableHtml = match[0];
    if (!tableHtml) {
      continue;
    }

    if (matcher && !matcher(tableHtml)) {
      continue;
    }

    return parseTable(tableHtml);
  }

  return null;
}

function parseTable(tableHtml: string): ParsedHtmlTable {
  const rows: ParsedHtmlRow[] = [];
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of tableHtml.matchAll(rowPattern)) {
    const rowHtml = rowMatch[1];
    if (!rowHtml) {
      continue;
    }

    const cells: ParsedHtmlCell[] = [];
    const cellPattern = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;

    for (const cellMatch of rowHtml.matchAll(cellPattern)) {
      const tag = cellMatch[1] as "th" | "td";
      const attributeSource = cellMatch[2] ?? "";
      const cellHtml = cellMatch[3] ?? "";
      cells.push({
        tag,
        text: stripHtml(cellHtml),
        html: cellHtml,
        attributes: parseAttributes(attributeSource),
      });
    }

    if (cells.length > 0) {
      rows.push({ cells });
    }
  }

  return { rows };
}
