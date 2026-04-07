function decodeEntities(html) {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

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

function escapePdfText(line) {
  return line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
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
  objects[fontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

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
