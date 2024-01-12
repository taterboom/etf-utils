import search from "@/etf_search_tool"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { codes } = await req.json()
  const result = await search(codes)
  return Response.json(result)
}
