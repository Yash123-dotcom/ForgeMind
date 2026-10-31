export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('Request body exceeds the 4 MB limit');
    this.name = 'RequestBodyTooLargeError';
  }
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super('Request body must contain valid JSON');
    this.name = 'InvalidJsonBodyError';
  }
}

const MAX_BODY_SIZE = 4 * 1024 * 1024;

export async function readLimitedJson(req: Request): Promise<unknown> {
  const contentLength = req.headers.get('content-length');

  if (contentLength !== null) {
    const declaredSize = Number(contentLength);

    if (!Number.isSafeInteger(declaredSize) || declaredSize < 0) {
      throw new InvalidJsonBodyError();
    }

    if (declaredSize > MAX_BODY_SIZE) {
      throw new RequestBodyTooLargeError();
    }
  }

  if (!req.body) {
    throw new InvalidJsonBodyError();
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalSize += value.byteLength;

      if (totalSize > MAX_BODY_SIZE) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalSize);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return JSON.parse(text);
  } catch {
    throw new InvalidJsonBodyError();
  }
}