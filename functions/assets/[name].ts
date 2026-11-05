// In-memory buffer cache across requests in the same isolate
const bufferCache = new Map<string, { buffer: ArrayBuffer; contentType: string }>();

export async function onRequest(context: { request: Request; env: any; params: { name: string } }) {
  const range = context.request.headers.get("range");
  const fileName = context.params.name.toLowerCase();
  const isVideo = fileName.endsWith(".webm") || fileName.endsWith(".mp4");

  // Non-video files or requests without Range can be served directly by ASSETS
  if (!range || !isVideo) {
    return context.env.ASSETS.fetch(context.request);
  }

  // Parse Range header e.g. "bytes=0-1024" or "bytes=1024-"
  const bytesMatch = range.match(/bytes=(\d+)-(\d*)/);
  if (!bytesMatch) {
    return context.env.ASSETS.fetch(context.request);
  }

  // Retrieve cached ArrayBuffer or fetch once
  let entry = bufferCache.get(fileName);
  if (!entry) {
    const fullReq = new Request(context.request.url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });
    const res = await context.env.ASSETS.fetch(fullReq);
    if (!res.ok) {
      return res;
    }
    const buf = await res.arrayBuffer();
    const contentType = fileName.endsWith(".webm") ? "video/webm" : "video/mp4";
    entry = { buffer: buf, contentType };
    // Keep in cache (each isolate has up to 128MB RAM, 2 videos ~43MB fits easily)
    bufferCache.set(fileName, entry);
  }

  const { buffer, contentType } = entry;
  const total = buffer.byteLength;
  const start = parseInt(bytesMatch[1], 10);
  const end = bytesMatch[2] ? parseInt(bytesMatch[2], 10) : total - 1;

  if (start >= total || end >= total || start > end) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${total}`,
      },
    });
  }

  // Sub-millisecond slice directly from cached ArrayBuffer
  const chunk = buffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Length": String(chunk.byteLength),
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
