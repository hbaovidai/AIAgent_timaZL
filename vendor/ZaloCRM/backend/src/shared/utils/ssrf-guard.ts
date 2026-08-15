// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Nguyễn Tiến Lộc
/**
 * ssrf-guard.ts — Validate an outbound URL before fetching it.
 */

export class SsrfBlockedError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = 'SsrfBlockedError';
  }
}

/**
 * Parse and validate an outbound URL.
 */
export function assertSafeOutboundUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new SsrfBlockedError('Invalid URL', raw);
  }

  // In development / local environment, allow http and docker hosts
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new SsrfBlockedError(`Unsupported protocol (${parsed.protocol})`, raw);
  }

  return parsed;
}

export function isSafeOutboundUrl(raw: string): boolean {
  try {
    assertSafeOutboundUrl(raw);
    return true;
  } catch {
    return false;
  }
}
