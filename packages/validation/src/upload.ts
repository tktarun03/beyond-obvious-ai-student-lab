import { AppError } from '@lab/shared';
import { z } from 'zod';

/**
 * Upload validation — four independent controls, because each one alone is
 * bypassable:
 *
 *   1. size cap        -> stops memory exhaustion and runaway AI cost
 *   2. extension check -> catches the obvious cases early and cheaply
 *   3. MIME allowlist  -> the browser-declared type, which a client can lie about
 *   4. magic bytes     -> what the file ACTUALLY is, which a client cannot fake
 *
 * Control 4 is the one that matters. A file named invoice.pdf, sent with
 * Content-Type: application/pdf, containing an HTML page with a script tag,
 * fails only at step 4.
 */

export const ALLOWED_UPLOAD_TYPES = {
  'application/pdf': { extensions: ['.pdf'], magic: [[0x25, 0x50, 0x44, 0x46]] },
  'image/png': { extensions: ['.png'], magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], magic: [[0xff, 0xd8, 0xff]] },
  'text/plain': { extensions: ['.txt', '.md'], magic: [] },
  'text/markdown': { extensions: ['.md'], magic: [] },
  'text/csv': { extensions: ['.csv'], magic: [] },
} as const satisfies Record<string, { extensions: readonly string[]; magic: readonly number[][] }>;

export type AllowedMimeType = keyof typeof ALLOWED_UPLOAD_TYPES;

export interface UploadRules {
  readonly maxBytes: number;
  readonly allowedTypes: readonly AllowedMimeType[];
}

export interface UploadCandidate {
  readonly filename: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array;
}

const WINDOWS_RESERVED = /[<>:"|?*]/g;
/** A literal backslash, written this way so the escaping is unambiguous. */
const BACKSLASH = String.fromCharCode(92);
const isSafeFilenameChar = (char: string) => {
  const code = char.charCodeAt(0);
  return code > 0x1f && code !== 0x7f;
};

/**
 * Strips directory traversal and control characters from a client-supplied
 * filename. The result is only ever used as a display label — files are stored
 * under a generated id, never under a name the user chose.
 */
export function sanitiseFilename(raw: string): string {
  // Normalise both path separators, then keep only the final segment.
  const base = raw.split(BACKSLASH).join('/').split('/').pop() ?? 'file';
  const cleaned = base
    .split('')
    .filter(isSafeFilenameChar)
    .join('')
    .replace(WINDOWS_RESERVED, '_')
    .replace(/^\.+/, '')
    .trim();
  return cleaned.slice(0, 120) || 'file';
}

function matchesMagic(bytes: Uint8Array, signatures: readonly (readonly number[])[]): boolean {
  if (signatures.length === 0) return true; // text formats have no reliable signature
  return signatures.some((sig) => sig.every((byte, i) => bytes[i] === byte));
}

/** Rejects anything that looks like markup or a script, whatever it claims to be. */
function looksLikeMarkup(bytes: Uint8Array): boolean {
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, 512))
    .trimStart()
    .toLowerCase();
  return (
    head.startsWith('<!doctype html') ||
    head.startsWith('<html') ||
    head.startsWith('<?xml') ||
    head.startsWith('<script')
  );
}

export function validateUpload(candidate: UploadCandidate, rules: UploadRules): void {
  const filename = sanitiseFilename(candidate.filename);

  if (candidate.bytes.byteLength === 0) {
    throw new AppError('VALIDATION_FAILED', 'Empty upload', { userMessage: 'That file is empty.' });
  }

  if (candidate.bytes.byteLength > rules.maxBytes) {
    throw new AppError('PAYLOAD_TOO_LARGE', 'Upload exceeds size cap', {
      details: { bytes: candidate.bytes.byteLength, maxBytes: rules.maxBytes },
      userMessage: `That file is ${formatBytes(candidate.bytes.byteLength)}. The limit is ${formatBytes(rules.maxBytes)}.`,
    });
  }

  const mimeType = candidate.mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!rules.allowedTypes.includes(mimeType as AllowedMimeType)) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', `Rejected MIME type ${mimeType}`, {
      details: { mimeType, filename },
      userMessage: `${filename} is not an accepted file type. Accepted: ${rules.allowedTypes.join(', ')}.`,
    });
  }

  const spec = ALLOWED_UPLOAD_TYPES[mimeType as AllowedMimeType];
  const extension = filename.includes('.') ? `.${filename.split('.').pop()!.toLowerCase()}` : '';
  if (extension && !(spec.extensions as readonly string[]).includes(extension)) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Extension does not match declared type', {
      details: { extension, mimeType },
      userMessage: `${filename} has an extension that does not match its content type.`,
    });
  }

  if (!matchesMagic(candidate.bytes, spec.magic)) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'File signature does not match declared type', {
      details: { mimeType, filename },
      userMessage: `${filename} does not actually appear to be a ${mimeType} file.`,
    });
  }

  if (mimeType.startsWith('text/') && looksLikeMarkup(candidate.bytes)) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Markup content rejected in a text upload', {
      userMessage: `${filename} looks like a web page rather than plain text.`,
    });
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const uploadMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
});
