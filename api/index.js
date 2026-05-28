import server from '../dist/server/server.js';

export default async function handler(request, response) {
  // Convert Node.js request to standard Request object required by TanStack server.fetch
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const url = new URL(request.url, `${protocol}://${host}`);

  // Create standard Request
  const webRequest = new Request(url.href, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    duplex: 'half'
  });

  try {
    // Execute TanStack Start SSR Worker
    const webResponse = await server.fetch(webRequest);

    // Stream the response back to Vercel
    response.status(webResponse.status);
    
    webResponse.headers.forEach((value, key) => {
      response.setHeader(key, value);
    });

    if (webResponse.body) {
      for await (const chunk of webResponse.body) {
        response.write(chunk);
      }
    }
    response.end();
  } catch (error) {
    console.error('SSR Error:', error);
    response.status(500).send('Internal Server Error');
  }
}
