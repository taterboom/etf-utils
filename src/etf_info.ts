/**
 * https://www.csindex.com.cn/#/indices/indexProduct
 */

import fs from "fs"
import { pick } from "lodash"
import path from "path"
import Pb from "progress"
import { readXlsx } from "./utils"

export type ETFProduct = {
  productCode: string // 这个是标的的股票代码
  // fundName: string
  // fundNameEn: string
  // assetClass: string
  // assetClassEn: string
  // fundType: string
  // fundTypeEn: string
  // coverage: string
  // coverageEn: string
  indexCode: string // 这个用于下载cons.xls
  indexNameCn: string // 这个是标的指数名称
  // indexNameEn: string
  aum: string
  // aumEn: string
  // fundManager: string
  // fundManagerEn: string
  // inceptionDate: string
  // exchange: string
  // exchangeEn: string
}

export type ETFElement = {
  // 日期Date: string
  "指数代码 Index Code": string
  // "指数名称 Index Name": string
  // "指数英文名称Index Name(Eng)": string
  "成份券代码Constituent Code"?: string
  // "成份券名称Constituent Name"?: string
  "沪市代码Constituent Code SHH"?: string
  // "沪市名称Constituent Name SHH"?: string
  "深市代码Constituent Code SZH"?: string
  // "深市名称Constituent Name SZH"?: string
  // "成份券英文名称Constituent Name(Eng)": string
  // 交易所Exchange: string
  // "交易所英文名称Exchange(Eng)": string
}
function readAllData() {
  const dir = path.join(__dirname, "../data/etf")
  const files = fs.readdirSync(dir)
  const data: ETFElement[][] = []
  for (const file of files) {
    const filePath = path.join(dir, file)
    const d = readXlsx<ETFElement>(filePath)
    data.push(
      d.map((item) =>
        pick(item, [
          "指数代码 Index Code",
          "成份券代码Constituent Code",
          "沪市代码Constituent Code SHH",
          "深市代码Constituent Code SZH",
        ])
      )
    )
  }
  return data
}

export async function prepareEtfs() {
  const result: { data: ETFProduct[] } = await fetch(
    "https://www.csindex.com.cn/csindex-home/index-list/funds-tracking-index",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang: "cn",
        pager: { pageNum: 1, pageSize: 1000 }, // 截至20240101，大概700多个
        fundsFilter: {
          fundSize: null,
          assetClass: null,
          fundType: ["etf"],
          coverage: ["china_mainland", "hong_kong", "sh_sz_hk"],
          market: null,
          fundAge: null,
          manager: null,
        },
      }),
    }
  ).then((res) => res.json())

  if (!fs.existsSync("src/assets")) {
    fs.mkdirSync("src/assets")
  }

  fs.writeFileSync(
    "src/assets/etf.json",
    JSON.stringify(
      result.data.map((item) => pick(item, ["productCode", "indexCode", "indexNameCn", "aum"])),
      null,
      2
    )
  )

  if (!fs.existsSync("data/etf")) {
    fs.mkdirSync("data/etf", { recursive: true })
  }

  const pb = new Pb("[:bar] :current/:total", { total: result.data.length })

  for (const i in result.data) {
    const product = result.data[i]
    const url = `https://csi-web-dev.oss-cn-shanghai-finance-1-pub.aliyuncs.com/static/html/csindex/public/uploads/file/autofile/cons/${product.indexCode}cons.xls`
    const buf = await fetch(url).then((res) => {
      if (res.ok) {
        return res.arrayBuffer()
      } else {
        return null
      }
    })
    if (buf === null) {
      console.log(`🔴 [${i}] ${product.indexCode} ${product.indexNameCn} ${url}`)
      continue
    }
    const fileName = `data/etf/${product.indexCode}.xlsx`
    fs.writeFileSync(fileName, Buffer.from(buf))
    pb.tick()
  }

  const db = readAllData()

  if (!fs.existsSync("src/assets")) {
    fs.mkdirSync("src/assets", { recursive: true })
  }
  fs.writeFileSync(`src/assets/etfs.json`, JSON.stringify(db, null, 2))
}
