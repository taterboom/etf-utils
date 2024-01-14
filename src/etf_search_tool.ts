import fs from "fs"
import { pick } from "lodash"
import { parse } from "papaparse"
import path from "path"
import ETF from "./assets/etf.json"
import ETFS from "./assets/etfs.json"
import { ETFElement } from "./etf_info"
import { readInputCodesFromFutu } from "./utils"

const IGNORE_INDEX_CODE = [
  "930903", // 中证A股
  "000001", // 上证指数
  "932000", // 中证2000
  "000906", // 中证800
  "000905", // 中证500
  "000982", // 500等权
  "000852", // 上证1000
  "000009", // 上证380
  "931393", // 湖北指数
  "931588", // 1000价值稳健
  "931591", // 1000成长创新
]

function readInputCodesAtIndex(filepath: string, index: number): string[] {
  // futu exported data is utf-16le encoded
  const fileStr = fs.readFileSync(filepath, "utf-16le")
  const data = parse<string[]>(fileStr)
  const header = data.data[0]
  const codeIndex = index
  // @ts-ignore
  return data.data
    .slice(1)
    .map((item) => item[codeIndex])
    .filter(Boolean)
}

const readCodes = (filepath: string, options: { app?: string; index?: number }) => {
  let codes: string[] = []
  if (options.app) {
    if (options.app === "futu") {
      codes = readInputCodesFromFutu(fs.readFileSync(filepath))
    }
  } else {
    codes = readInputCodesAtIndex(filepath, options.index || 0)
  }
  if (codes.length === 0) {
    throw new Error("No codes found")
  }
  console.log("Total: ", codes.length)
  return codes
}

export type Result = {
  total: number
  score: number
  productCode: string
  indexCode: string
  indexNameCn: string
  aum: string
}[]

export default async function search(codes: string[]) {
  const db = ETFS as ETFElement[][]

  const etfIndexCodesList = codes.map((code) =>
    db
      .filter((etfElements) =>
        etfElements.some(
          (etfElement) =>
            etfElement["成份券代码Constituent Code"] === code ||
            etfElement["沪市代码Constituent Code SHH"] === code ||
            etfElement["深市代码Constituent Code SZH"] === code
        )
      )
      .map((item) => item[0]["指数代码 Index Code"])
  )
  const sorts: { [x in string]: number } = {}
  etfIndexCodesList.forEach((etfIndexCodes) => {
    etfIndexCodes.forEach((code) => {
      if (sorts[code] === undefined) {
        sorts[code] = 0
      }
      sorts[code]++
    })
  })
  const sorted = Object.keys(sorts)
    .filter((indexCode) => sorts[indexCode] > 1)
    .sort((a, b) => sorts[b] - sorts[a])
  const result: Result = sorted
    .filter((indexCode) => !IGNORE_INDEX_CODE.includes(indexCode))
    .map((indexCode) => ETF.filter((item) => item.indexCode === indexCode))
    .map((etfs) => {
      return etfs
        .map((etf) => ({
          ...pick(etf!, ["productCode", "indexCode", "indexNameCn", "aum"]),
          total: db.find((etfElemets) =>
            etfElemets.some((etfElement) => etfElement["指数代码 Index Code"] === etf!.indexCode)
          )!.length,
          score: sorts[etf!.indexCode],
        }))
        .sort((a, b) => +b.aum - +a.aum)
    })
    .flat()
    .slice(0, 10)

  return result
}

// if executed directly
if (require.main === module) {
  const filepath = path.resolve(__dirname, "../input/t.csv")
  search(readCodes(filepath, { app: "futu" }))
}
