import fs from "fs"
import path from "path"
import { readXlsx } from "./utils"

type StockMeta = {
  code: string
  name: string
}

type ETFMeta = {
  code: string
  name: string
  indexCode: string
  indexName?: string
}

// http://www.sse.com.cn/assortment/stock/list/share/
async function getShStockData() {
  const res = await fetch(
    "http://query.sse.com.cn/sseQuery/commonExcelDd.do?sqlId=COMMON_SSE_CP_GPJCTPZ_GPLB_GP_L&type=inParams&CSRC_CODE=&STOCK_CODE=&REG_PROVINCE=&STOCK_TYPE=1&COMPANY_STATUS=2,4,5,7,8",
    {
      headers: {
        Referer: "http://www.sse.com.cn/",
      },
    }
  )
  const data = await res.arrayBuffer()
  const workbook = readXlsx<{ A股代码: string; 证券简称: string }>(data)
  return workbook.map((item) => {
    return {
      code: item["A股代码"],
      name: item["证券简称"],
    }
  })
}

// http://www.sse.com.cn/assortment/fund/list/
async function getShEtfData() {
  const res = await fetch(
    "http://query.sse.com.cn/commonSoaQuery.do?jsonCallBack=jsonpCallback123098&isPagination=true&pageHelp.pageSize=10&pageHelp.pageNo=1&pageHelp.beginPage=1&pageHelp.cacheSize=1&pageHelp.endPage=1&pagecache=false&sqlId=FUND_LIST&fundType=00&subClass=01%2C02%2C03%2C04%2C06%2C08%2C09%2C31%2C32%2C33%2C34%2C35%2C36%2C37%2C38&order&_=1704533155978",
    {
      headers: {
        Referer: "http://www.sse.com.cn/",
      },
    }
  )
  const text = await res.text()
  const data = JSON.parse(text.slice("jsonpCallback123098".length + 1, -1))
  return data.pageHelp.data.map((item: any) => {
    return {
      code: item["fundCode"],
      name: item["secNameFull"],
      indexCode: item["INDEX_CODE"],
      indexName: item["INDEX_NAME"],
    } as ETFMeta
  })
}

// https://www.szse.cn/market/product/stock/list/index.html
async function getSzStockData() {
  const res = await fetch(
    "https://www.szse.cn/api/report/ShowReport?SHOWTYPE=xlsx&CATALOGID=1110&TABKEY=tab1&random=0.9616546244672859"
  )
  const data = await res.arrayBuffer()
  const workbook = readXlsx<{ A股代码: string; A股简称: string }>(data)
  return workbook.map((item) => {
    return {
      code: item["A股代码"],
      name: item["A股简称"],
    }
  })
}

// https://www.szse.cn/market/product/list/etfList/index.html
async function getSzEtfData() {
  const res = await fetch(
    "https://www.szse.cn/api/report/ShowReport?SHOWTYPE=xlsx&CATALOGID=1945&tab1PAGENO=1&random=0.21320424803774074&TABKEY=tab1"
  )
  const data = await res.arrayBuffer()
  const workbook = readXlsx<{ 证券代码: string; 证券简称: string; 拟合指数: string }>(data)
  return workbook.map((item) => {
    const [indexCode, indexName] = item["拟合指数"].split(" ")
    return {
      code: item["证券代码"],
      name: item["证券简称"],
      indexCode,
      indexName,
    }
  })
}

async function getAllStockAndEtfMeta() {
  let allStockAndEtfData: Array<StockMeta | ETFMeta> = []
  const cacheDir = path.resolve(__dirname, "../data/cache")
  const cacheFilePath = path.resolve(cacheDir, "./meta.json")
  if (fs.existsSync(cacheFilePath)) {
    allStockAndEtfData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"))
  } else {
    const [shStock, shEtf, szStock, szEtf] = await Promise.all([
      getShStockData(),
      getShEtfData(),
      getSzStockData(),
      getSzEtfData(),
    ])
    allStockAndEtfData = [...shStock, ...shEtf, ...szStock, ...szEtf]
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(allStockAndEtfData, null, 2))
  }
  return allStockAndEtfData
}

getAllStockAndEtfMeta().then(console.log)
