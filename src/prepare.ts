import { prepareEtfs } from "./etf_info"
import { prepareAllStockAndEtfMeta } from "./stock_meta"

function main() {
  prepareEtfs()
  prepareAllStockAndEtfMeta()
}

main()
