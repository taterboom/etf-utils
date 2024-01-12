"use client"

import { useFormState, useFormStatus } from "react-dom"
import { searchEtf } from "./actions/searchEtf"
import { readInputCodesFromFutu } from "@/utils"
import { useRef } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      fuck
    </button>
  )
}

export default function Page() {
  const [state, action] = useFormState(searchEtf, { result: [] })
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div>
      <form ref={formRef} action={action}>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const buf = await file.arrayBuffer()
            const codes = readInputCodesFromFutu(buf)
            // @ts-ignore
            formRef.current!.querySelector("[name=codes]").value = codes.join(",")
          }}
        />
        <input type="text" name="codes" hidden />
        <SubmitButton />
      </form>
      result: {JSON.stringify(state, null, 2)}
    </div>
  )
}
