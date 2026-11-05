export async function onRequest(context: { request: Request }) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get("url");
  if (!target) return new Response("Missing url param", { status: 400 });
  return Response.redirect(new URL(target, url.origin).toString(), 302);
}
