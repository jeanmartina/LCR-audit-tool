function decodeEntities(html) {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const WIN_ANSI_FALLBACK = 63; // '?'
const WIN_ANSI_MAP = new Map([
  [0x20ac, 128],
  [0x201a, 130],
  [0x0192, 131],
  [0x201e, 132],
  [0x2026, 133],
  [0x2020, 134],
  [0x2021, 135],
  [0x02c6, 136],
  [0x2030, 137],
  [0x0160, 138],
  [0x2039, 139],
  [0x0152, 140],
  [0x017d, 142],
  [0x2018, 145],
  [0x2019, 146],
  [0x201c, 147],
  [0x201d, 148],
  [0x2022, 149],
  [0x2013, 150],
  [0x2014, 151],
  [0x02dc, 152],
  [0x2122, 153],
  [0x0161, 154],
  [0x203a, 155],
  [0x0153, 156],
  [0x017e, 158],
  [0x0178, 159],
]);

function stripHtmlToText(html) {
  const withBreaks = html
    .replace(/<\/(h1|h2|h3|p|div|section|article|li|tr|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<li>/gi, "- ");

  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");
  return decodeEntities(withoutTags)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function toWinAnsiBytes(text) {
  const bytes = [];
  for (const char of text.normalize("NFC")) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) {
      bytes.push(WIN_ANSI_FALLBACK);
      continue;
    }
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }
    const mapped = WIN_ANSI_MAP.get(codePoint);
    bytes.push(mapped ?? WIN_ANSI_FALLBACK);
  }
  return bytes;
}

function escapePdfText(line) {
  return toWinAnsiBytes(line)
    .map((value) => {
      if (value === 40 || value === 41 || value === 92) {
        return `\\${value.toString(8).padStart(3, "0")}`;
      }
      if (value >= 32 && value <= 126) {
        return String.fromCharCode(value);
      }
      return `\\${value.toString(8).padStart(3, "0")}`;
    })
    .join("");
}

function wrapLine(line, limit) {
  if (line.length <= limit) {
    return [line];
  }

  const words = line.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > limit && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function buildContentStream(pageLines) {
  const commands = ["BT", "/F1 11 Tf", "50 770 Td"];
  pageLines.forEach((line, index) => {
    if (index > 0) {
      commands.push("0 -16 Td");
    }
    commands.push(`(${escapePdfText(line)}) Tj`);
  });
  commands.push("ET");
  return commands.join("\n");
}

function createPdfBytesFromText(text) {
  const normalizedLines = text
    .split("\n")
    .flatMap((line) => wrapLine(line, 92));

  const linesPerPage = 42;
  const pages = [];
  for (let index = 0; index < normalizedLines.length; index += linesPerPage) {
    pages.push(normalizedLines.slice(index, index + linesPerPage));
  }
  if (pages.length === 0) {
    pages.push(["Empty PDF report"]);
  }

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageObjectIds = [];
  const firstPageObjectId = 3;
  const firstContentObjectId = firstPageObjectId + pages.length;
  const fontObjectId = firstContentObjectId + pages.length;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const pageObjectId = firstPageObjectId + pageIndex;
    const contentObjectId = firstContentObjectId + pageIndex;
    pageObjectIds.push(`${pageObjectId} 0 R`);
    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >>`;
    const contentStream = buildContentStream(pages[pageIndex]);
    objects[contentObjectId] =
      `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`;
  }

  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.join(" ")}] >>`;
  objects[fontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";

  let output = "%PDF-1.4\n";
  const offsets = [0];
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    if (!objects[objectId]) {
      continue;
    }
    offsets[objectId] = Buffer.byteLength(output, "utf8");
    output += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${objects.length}\n`;
  output += "0000000000 65535 f \n";
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    if (!objects[objectId]) {
      output += "0000000000 00000 f \n";
      continue;
    }
    output += `${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(output, "utf8");
}

function createPdfBytesFromHtml(html) {
  return createPdfBytesFromText(stripHtmlToText(html));
}

function hasPdfSignature(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

module.exports = {
  createPdfBytesFromHtml,
  createPdfBytesFromText,
  hasPdfSignature,
  stripHtmlToText,
};
