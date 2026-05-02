import { createHash } from "node:crypto";
import type { MonitoringSourceEventStatus } from "./document-types";
import {
  fetchMonitoringSourceBytes,
  getMonitoringSourceMaxExtractedTextBytes,
} from "./fetch-safety";
import type { MonitoringSourceRecord } from "./types";
import {
  findLatestDocumentSnapshotForSource,
  recordDocumentSnapshot,
  recordMonitoringSourceEvent,
} from "../storage/runtime-store";

export interface ExtractDocumentTextInput {
  body: Buffer;
  contentType: string | null;
  maxBytes?: number;
}

export interface ExtractDocumentTextResult {
  text: string | null;
  metadata: Record<string, unknown>;
  extractionStatus: "not_attempted" | "succeeded" | "truncated" | "failed";
  extractedTextTruncated: boolean;
  extractionFailureReason: string | null;
}

export interface CheckPolicyDocumentSourceResult {
  eventId: string;
  snapshotId: string | null;
  status: MonitoringSourceEventStatus;
  sha256: string | null;
}

type PdfJsModule = {
  getDocument(input: { data: Uint8Array; disableWorker: boolean }): {
    promise: Promise<PdfDocument>;
  };
};

type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{
      items: Array<{ str?: string }>;
    }>;
  }>;
  destroy?(): Promise<void> | void;
};

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function boundText(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const buffer = Buffer.from(text, "utf8");
  if (buffer.byteLength <= maxBytes) {
    return { text, truncated: false };
  }
  return {
    text: buffer.subarray(0, maxBytes).toString("utf8").replace(/\uFFFD+$/u, ""),
    truncated: true,
  };
}

function isLikelyUtf8Text(body: Buffer): boolean {
  if (body.includes(0)) return false;
  const sample = body.subarray(0, Math.min(body.length, 4096));
  let controlCount = 0;
  for (const byte of sample) {
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) controlCount += 1;
  }
  return sample.length === 0 || controlCount / sample.length < 0.02;
}

function sniffDocumentType(body: Buffer, contentType: string | null): string {
  const declared = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  const head = body.subarray(0, Math.min(body.length, 512)).toString("utf8").trimStart().toLowerCase();
  if (declared === "application/pdf" || body.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  if (declared === "text/html" || head.startsWith("<!doctype html") || head.startsWith("<html")) {
    return "text/html";
  }
  if (declared.startsWith("text/") || isLikelyUtf8Text(body)) {
    return "text/plain";
  }
  return declared || "application/octet-stream";
}

function stripHtmlToText(body: Buffer): string {
  let html = body.toString("utf8");
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  html = html.replace(/<!--[\s\S]*?-->/g, " ");
  html = html.replace(/<[^>]+>/g, " ");
  html = html.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => HTML_ENTITY_MAP[entity] ?? entity);
  return normalizeWhitespace(html);
}

async function loadPdfJs(): Promise<PdfJsModule> {
  const dynamicImport = new Function("specifier", "return import(specifier)") as (
    specifier: string
  ) => Promise<PdfJsModule>;
  return dynamicImport("pdfjs-dist/legacy/build/pdf.mjs");
}

async function extractPdfText(body: Buffer): Promise<{ text: string; pageCount: number }> {
  const pdfjs = await loadPdfJs();
  const document = await pdfjs.getDocument({ data: new Uint8Array(body), disableWorker: true }).promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      pages.push(textContent.items.map((item) => item.str ?? "").join(" "));
    }
    return { text: normalizeWhitespace(pages.join("\n")), pageCount: document.numPages };
  } finally {
    await document.destroy?.();
  }
}

export async function extractDocumentText(
  input: ExtractDocumentTextInput
): Promise<ExtractDocumentTextResult> {
  const maxBytes = input.maxBytes ?? getMonitoringSourceMaxExtractedTextBytes();
  const sniffedType = sniffDocumentType(input.body, input.contentType);
  const metadata: Record<string, unknown> = {
    declaredContentType: input.contentType,
    sniffedType,
  };

  if (sniffedType === "text/plain") {
    const bounded = boundText(normalizeWhitespace(input.body.toString("utf8")), maxBytes);
    metadata.textLength = bounded.text.length;
    metadata.extractor = "plain-text";
    return {
      text: bounded.text,
      metadata,
      extractionStatus: bounded.truncated ? "truncated" : "succeeded",
      extractedTextTruncated: bounded.truncated,
      extractionFailureReason: null,
    };
  }

  if (sniffedType === "text/html") {
    const bounded = boundText(stripHtmlToText(input.body), maxBytes);
    metadata.textLength = bounded.text.length;
    metadata.extractor = "html-stripper";
    return {
      text: bounded.text,
      metadata,
      extractionStatus: bounded.truncated ? "truncated" : "succeeded",
      extractedTextTruncated: bounded.truncated,
      extractionFailureReason: null,
    };
  }

  if (sniffedType === "application/pdf") {
    try {
      const extracted = await extractPdfText(input.body);
      const bounded = boundText(extracted.text, maxBytes);
      metadata.textLength = bounded.text.length;
      metadata.pageCount = extracted.pageCount;
      metadata.extractor = "pdfjs-dist";
      return {
        text: bounded.text,
        metadata,
        extractionStatus: bounded.truncated ? "truncated" : "succeeded",
        extractedTextTruncated: bounded.truncated,
        extractionFailureReason: null,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      metadata.extractor = "pdfjs-dist";
      return {
        text: null,
        metadata,
        extractionStatus: "failed",
        extractedTextTruncated: false,
        extractionFailureReason: `pdf-extraction-failed:${reason}`,
      };
    }
  }

  metadata.extractor = "not-attempted";
  return {
    text: null,
    metadata,
    extractionStatus: "not_attempted",
    extractedTextTruncated: false,
    extractionFailureReason: null,
  };
}

function sha256(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

function classifyFetchFailure(error: unknown): MonitoringSourceEventStatus {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("monitoring-source-url-private-address-blocked") ||
    message.includes("monitoring-source-url-invalid-scheme")
  ) {
    return "blocked";
  }
  if (message.includes("monitoring-source-document-too-large")) {
    return "oversized";
  }
  return "unavailable";
}

async function recordDocumentCheckEvent(input: {
  source: MonitoringSourceRecord;
  status: MonitoringSourceEventStatus;
  statusLabel?: string | null;
  durationMs: number;
  httpStatus?: number | null;
  contentType?: string | null;
  contentLength?: number | null;
  contentSha256?: string | null;
  failureReason?: string | null;
  snapshotId?: string | null;
}): Promise<CheckPolicyDocumentSourceResult> {
  const event = await recordMonitoringSourceEvent({
    sourceId: input.source.id,
    sourceKey: input.source.sourceKey,
    sourceType: input.source.sourceType,
    status: input.status,
    statusLabel: input.statusLabel ?? input.status,
    durationMs: input.durationMs,
    httpStatus: input.httpStatus ?? null,
    contentType: input.contentType ?? null,
    contentLength: input.contentLength ?? null,
    contentSha256: input.contentSha256 ?? null,
    failureReason: input.failureReason ?? null,
    snapshotId: input.snapshotId ?? null,
  });
  return {
    eventId: event.id,
    snapshotId: event.snapshotId,
    status: event.status,
    sha256: event.contentSha256,
  };
}

export async function checkPolicyDocumentSource(
  source: MonitoringSourceRecord
): Promise<CheckPolicyDocumentSourceResult> {
  if (source.sourceType !== "policy-document") {
    return recordDocumentCheckEvent({
      source,
      status: "not_checkable",
      durationMs: 0,
      failureReason: "source-not-policy-document",
    });
  }

  if (source.state !== "discovered" || !source.sourceUrl) {
    return recordDocumentCheckEvent({
      source,
      status: "not_checkable",
      durationMs: 0,
      failureReason: "policy-document-source-not-discovered",
    });
  }

  const startedAt = Date.now();
  try {
    const fetched = await fetchMonitoringSourceBytes(source.sourceUrl);
    const contentSha256 = sha256(fetched.body);
    const latest = await findLatestDocumentSnapshotForSource(source.id);
    if (latest?.sha256 === contentSha256) {
      return recordDocumentCheckEvent({
        source,
        status: "unchanged",
        durationMs: fetched.durationMs,
        httpStatus: fetched.status,
        contentType: fetched.contentType,
        contentLength: fetched.contentLength,
        contentSha256,
        snapshotId: latest.id,
      });
    }

    const extraction = await extractDocumentText({
      body: fetched.body,
      contentType: fetched.contentType,
    });
    const snapshot = await recordDocumentSnapshot({
      sourceId: source.id,
      sourceKey: source.sourceKey,
      certificateId: source.certificateId,
      fingerprint: source.fingerprint,
      sourceUrl: source.sourceUrl,
      normalizedUrl: source.normalizedUrl,
      finalUrl: fetched.finalUrl,
      policyOid: source.policyOid,
      documentRole: source.documentRole,
      trustListSourceId: source.trustListSourceId,
      trustListSnapshotId: source.trustListSnapshotId,
      trustListRunId: source.trustListRunId,
      contentType: fetched.contentType,
      sizeBytes: fetched.contentLength,
      sha256: contentSha256,
      rawBodyBase64: fetched.body.toString("base64"),
      extractedText: extraction.text,
      extractedTextTruncated: extraction.extractedTextTruncated,
      extractionStatus: extraction.extractionStatus,
      extractionFailureReason: extraction.extractionFailureReason,
      metadataJson: {
        ...extraction.metadata,
        httpStatus: fetched.status,
        sourceUrl: source.sourceUrl,
        finalUrl: fetched.finalUrl,
      },
    });
    const status: MonitoringSourceEventStatus = extraction.extractionStatus === "failed"
      ? "extraction_failed"
      : latest
        ? "changed"
        : "available";
    return recordDocumentCheckEvent({
      source,
      status,
      durationMs: fetched.durationMs,
      httpStatus: fetched.status,
      contentType: fetched.contentType,
      contentLength: fetched.contentLength,
      contentSha256,
      failureReason: extraction.extractionFailureReason,
      snapshotId: snapshot.id,
    });
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : String(error);
    return recordDocumentCheckEvent({
      source,
      status: classifyFetchFailure(error),
      durationMs: Date.now() - startedAt,
      failureReason,
    });
  }
}
