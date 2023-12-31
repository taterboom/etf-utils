import fs from "fs"
import { parse } from "papaparse"
import path from "path"
import xlsx from "xlsx"
import ETF from "../data/etf.json"

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

function readXlsx(filePath: string) {
  const workbook = xlsx.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = xlsx.utils.sheet_to_json(sheet)
  return data as ETFElement[]
}

function readAllData() {
  const dir = path.join(__dirname, "../data/etf")
  const files = fs.readdirSync(dir)
  const data: ETFElement[][] = []
  for (const file of files) {
    const filePath = path.join(dir, file)
    const d = readXlsx(filePath)
    data.push(d)
  }
  return data
}

function readInputCodes(pathname: string): string[] {
  const filepath = path.resolve(__dirname, "../input", `${pathname}.csv`)
  const fileBuf = fs.readFileSync(filepath)
  const data = parse(fileBuf.toString())
  /**
   * x.csv
   * 000001
   * 000002
   */
  // @ts-ignore
  return data.data.map((item) => item[0])
}

async function main() {
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

  const codes = readInputCodes(process.argv[2])
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
    .map((indexCode) => ETF.find((item) => item.indexCode === indexCode))
    .map((etf) => {
      return {
        ...pick(etf!, ["productCode", "indexCode", "indexNameCn", "aum"]),
        total: db.find((etfElemets) =>
          etfElemets.some((etfElement) => etfElement["指数代码 Index Code"] === etf!.indexCode)
        )!.length,
        score: sorts[etf!.indexCode],
      }
    })

  console.log("Total: ", codes.length)
  console.table(result)
}

main()
