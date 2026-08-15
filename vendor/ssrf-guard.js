export class SsrfBlockedError extends Error {
    url;
    constructor(message, url) {
        super(message);
        this.url = url;
        this.name = 'SsrfBlockedError';
    }
}

export function assertSafeOutboundUrl(raw) {
    let parsed;
    try {
        parsed = new URL(raw);
    } catch {
        throw new SsrfBlockedError('Invalid URL', raw);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new SsrfBlockedError(`Unsupported protocol (${parsed.protocol})`, raw);
    }
    return parsed;
}

export function isSafeOutboundUrl(raw) {
    try {
        assertSafeOutboundUrl(raw);
        return true;
    } catch {
        return false;
    }
}
