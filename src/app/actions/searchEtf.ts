"use server"

import search from "@/etf_search_tool"

export async function searchEtf(prevState: any, formData: FormData) {
  console.log("searchEtf", prevState)
  const codes = (formData.get("codes") as string).split(",")
  const result = await search(codes)
  return { result }
}
