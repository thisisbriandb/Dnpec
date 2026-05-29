import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const openapi = await readFile(path.join(process.cwd(), "docs", "api", "openapi.yaml"), "utf8");

  return new Response(openapi, {
    headers: {
      "content-type": "application/yaml; charset=utf-8",
    },
  });
}
