"use client"

import { useFormState, useFormStatus } from "react-dom"
import { searchEtf } from "./actions/searchEtf"
import { readInputCodesFromFutu } from "@/utils"
import { useRef, useState } from "react"
import ResultTable from "./table"
import type { Result } from "@/etf_search_tool"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [codesText, setCodesText] = useState<string>("")

  return (
    <div className="container mt-8 space-y-4">
      <form ref={formRef} action={action} className="space-y-4">
        <div className="space-y-2 w-96">
          <Label>Upload Futu App File</Label>
          <br />
          <Input
            type="file"
            accept=".csv,.txt"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              console.log(file)
              const buf = await file.arrayBuffer()
              const fileExt = file.name.split(".").pop()
              const codes = readInputCodesFromFutu(buf, fileExt as "txt" | "csv")
              setCodesText(codes.join())
            }}
          />
        </div>
        <div className="space-y-2 w-96">
          <Label>Or Input Codes</Label>
          <br />
          <Input
            type="text"
            name="codes"
            value={codesText}
            onChange={(e) => {
              setCodesText(e.target.value)
            }}
          />
        </div>
        <SubmitButton />
      </form>
      {state.result ? (
        <div>
          <h3 className="text-lg font-semibold">Results</h3>
          <ResultTable data={state.result} />
        </div>
      ) : null}
    </div>
  )
}
