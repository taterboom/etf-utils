import fs from "fs"
import { parse } from "papaparse"
import path from "path"
import { ETFProduct } from "./data"
import { readXlsx } from "./utils"

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

type ETFElement = {
  日期Date: string
  "指数代码 Index Code": string
  "指数名称 Index Name": string
  "指数英文名称Index Name(Eng)": string
  "成份券代码Constituent Code"?: string
  "成份券名称Constituent Name"?: string
  "沪市代码Constituent Code SHH"?: string
  "沪市名称Constituent Name SHH"?: string
  "深市代码Constituent Code SZH"?: string
  "深市名称Constituent Name SZH"?: string
  "成份券英文名称Constituent Name(Eng)": string
  交易所Exchange: string
  "交易所英文名称Exchange(Eng)": string
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const newObj = {} as Pick<T, K>
  for (const key of keys) {
    newObj[key] = obj[key]
  }
  return newObj
}

function readAllData() {
  const dir = path.join(__dirname, "../data/etf")
  const files = fs.readdirSync(dir)
  const data: ETFElement[][] = []
  for (const file of files) {
    const filePath = path.join(dir, file)
    const d = readXlsx<ETFElement>(filePath)
    data.push(d)
  }
  return data
}

function readInputCodesFromFutu(filepath: string): string[] {
  // futu exported data is utf-16le encoded
  const fileStr = fs.readFileSync(filepath, "utf-16le")
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

function getETF(): ETFProduct[] {
  const ETFPath = path.resolve(__dirname, "../data/etf.json")
  if (fs.existsSync(ETFPath)) {
    return JSON.parse(fs.readFileSync(ETFPath, "utf-8"))
  } else {
    throw new Error("etf.json not found, please pnpm run data first")
  }
}

export default async function search(filepath: string, options: { app?: string; index?: number }) {
  const ETF = getETF()
  const cacheDir = path.resolve(__dirname, "../data/cache")
  const cacheFilePath = path.resolve(cacheDir, "./etfs.json")
  let db: ETFElement[][] = []
  if (fs.existsSync(cacheFilePath)) {
    db = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"))
  } else {
    db = readAllData()
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(db, null, 2))
  }

  let codes: string[] = []
  if (options.app) {
    if (options.app === "futu") {
      codes = readInputCodesFromFutu(filepath)
    }
  } else {
    codes = readInputCodesAtIndex(filepath, options.index || 0)
  }
  if (codes.length === 0) {
    throw new Error("No codes found")
  }

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
  const result = sorted
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

  console.log("Total: ", codes.length)
  console.table(result.flat().slice(0, 10))
}

// if executed directly
if (require.main === module) {
  const filepath = path.resolve(__dirname, "../input/t.csv")
  search(filepath, { app: "futu" })
}
