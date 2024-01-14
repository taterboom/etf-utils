import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import type { Result } from "@/etf_search_tool"

export default function ResultTable(props: { data: Result }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[160px]">Product Code</TableHead>
          <TableHead className="min-w-[160px]">Index Code</TableHead>
          <TableHead className="min-w-[200px]">Index Name</TableHead>
          <TableHead className="min-w-[80px]">Total</TableHead>
          <TableHead className="min-w-[80px]">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.data.map((item) => {
          return (
            <TableRow key={item.productCode + item.indexCode}>
              <TableCell className="font-medium">{item.productCode}</TableCell>
              <TableCell>{item.indexCode}</TableCell>
              <TableCell>{item.indexNameCn}</TableCell>
              <TableCell>{item.total}</TableCell>
              <TableCell>{item.score}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
