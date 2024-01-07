import xlsx from "xlsx"

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
