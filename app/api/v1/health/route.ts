export async function GET() {
  return Response.json({
    status: "ok",
    service: "dnpec-collecte",
    apiVersion: "v1",
  });
}
