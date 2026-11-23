const defaultHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

function responseHeaders(result) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(result.headers || {})) {
    if (value !== undefined && value !== null && name.toLowerCase() !== 'set-cookie') {
      headers.set(name, Array.isArray(value) ? value.join(', ') : String(value));
    }
  }
  for (const [name, value] of Object.entries(result.multiValueHeaders || {})) {
    const values = Array.isArray(value) ? value : [value];
    if (name.toLowerCase() === 'set-cookie') {
      for (const cookie of values) if (cookie !== undefined && cookie !== null) headers.append('Set-Cookie', String(cookie));
    } else if (values.length) {
      headers.set(name, values.map(String).join(', '));
    }
  }
  return headers;
}

export function createVercelFunction(handler) {
  return {
    async fetch(request) {
      try {
        const url = new URL(request.url);
        const event = {
          httpMethod: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
          queryStringParameters: Object.fromEntries(url.searchParams.entries()),
        };
        const result = await handler(event);
        const status = Number.isInteger(result?.statusCode) ? result.statusCode : 200;
        let body = result?.body ?? null;
        if (result?.isBase64Encoded && typeof body === 'string') body = Buffer.from(body, 'base64');
        if (request.method === 'HEAD' || status === 204 || status === 304) body = null;
        return new Response(body, { status, headers: responseHeaders(result || {}) });
      } catch {
        return new Response(JSON.stringify({ error: 'Service unavailable. Please try again later.' }), {
          status: 500,
          headers: defaultHeaders,
        });
      }
    },
  };
}
