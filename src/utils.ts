import { parse } from "papaparse"
import * as xlsx from "xlsx"

export function readXlsx<R>(fileBufOrFilePath: string | ArrayBuffer) {
  const workbook =
    typeof fileBufOrFilePath === "string"
      ? xlsx.readFile(fileBufOrFilePath)
      : xlsx.read(fileBufOrFilePath, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = xlsx.utils.sheet_to_json(sheet)
  return data as R[]
}

export function readInputCodesFromFutu(fileBuf: Buffer | ArrayBuffer): string[] {
  const decoder = new TextDecoder("utf-16le")
  const fileStr = decoder.decode(fileBuf)
  const data = parse<string[]>(fileStr)
  const header = data.data[0]
  const codeIndex = header.findIndex((item) => item === "代码")
  /**
   * x.csv
   * 000001
   * 000002
   */
  // @ts-ignore
  return data.data
    .slice(1)
    .map((item) => item[codeIndex])
    .filter(Boolean)
}
