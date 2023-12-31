/**
 * https://www.csindex.com.cn/#/indices/indexProduct
 */

import fs from "fs"

type ETFProduct = {
  productCode: string // 这个是标的的股票代码
  fundName: string
  fundNameEn: string
  assetClass: string
  assetClassEn: string
  fundType: string
  fundTypeEn: string
  coverage: string
  coverageEn: string
  indexCode: string // 这个用于下载cons.xls
  indexNameCn: string // 这个是标的指数名称
  indexNameEn: string
  aum: string
  aumEn: string
  fundManager: string
  fundManagerEn: string
  inceptionDate: string
  exchange: string
  exchangeEn: string
}

async function main() {
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

  if (!fs.existsSync("data")) {
    fs.mkdirSync("data")
  }
  fs.writeFileSync("data/etf.json", JSON.stringify(result.data, null, 2))

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
    if (!fs.existsSync("data/etf")) {
      fs.mkdirSync("data/etf", { recursive: true })
    }
    const fileName = `data/etf/${product.indexCode}.xlsx`
    fs.writeFileSync(fileName, Buffer.from(buf))
  }
}

main()
