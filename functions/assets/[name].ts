export async function onRequest(context: { request: Request; env: any; params: { name: string } }) {
  const range = context.request.headers.get("range");
  
  // Create a clean request to ASSETS without Range header to get full file
  const fullReq = new Request(context.request.url, {
    method: "GET",
    headers: {
      "User-Agent": context.request.headers.get("User-Agent") || "Mozilla/5.0",
      "Accept": "*/*"
    }
  });

  const res = await context.env.ASSETS.fetch(fullReq);

  // If not a range request or not 200, return as-is
  if (!range || res.status !== 200) {
    return res;
  }

  // Parse Range header e.g. "bytes=0-1024" or "bytes=1024-"
  const bytesMatch = range.match(/bytes=(\d+)-(\d*)/);
  if (!bytesMatch) {
    return res;
  }

  const arrayBuffer = await res.arrayBuffer();
  const total = arrayBuffer.byteLength;
  if (total === 0) {
    return res;
  }

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

  const chunk = arrayBuffer.slice(start, end + 1);
  const ext = context.params.name.toLowerCase();
  const contentType = ext.endsWith(".webm") ? "video/webm" : 
                      ext.endsWith(".mp4") ? "video/mp4" : 
                      (res.headers.get("content-type") || "application/octet-stream");

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
