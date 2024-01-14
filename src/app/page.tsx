"use client"

import { useFormState, useFormStatus } from "react-dom"
import { searchEtf } from "./actions/searchEtf"
import { readInputCodesFromFutu } from "@/utils"
import { useRef, useState } from "react"
import ResultTable from "./table"
import type { Result } from "@/etf_search_tool"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      <MagnifyingGlassIcon /> Search
    </Button>
  )
}

export default function Page() {
  const [state, action] = useFormState<{ result: Result | null }, any>(searchEtf, { result: null })
  const formRef = useRef<HTMLFormElement>(null)
  const [codes, setCodes] = useState<string[] | null>(null)

  return (
    <div className="container mt-8 space-y-4">
      <form ref={formRef} action={action}>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            console.log(file)
            const buf = await file.arrayBuffer()
            const fileExt = file.name.split(".").pop()
            const codes = readInputCodesFromFutu(buf, fileExt as "txt" | "csv")
            setCodes(codes)
          }}
        />
        <input type="text" name="codes" hidden value={codes?.join(",")} />
        <SubmitButton />
      </form>
      {codes ? (
        <div>
          <h3 className="text-lg font-semibold">Codes</h3>
          <p>{codes.join(",")}</p>
        </div>
      ) : null}
      {state.result ? (
        <div>
          <h3 className="text-lg font-semibold">Results</h3>
          <ResultTable data={state.result} />
        </div>
      ) : null}
    </div>
  )
}
