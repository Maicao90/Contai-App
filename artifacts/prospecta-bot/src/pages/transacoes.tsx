import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Transaction = {
  id: number;
  description: string;
  category: string;
  amount: string;
  type: string;
  transactionDate: string;
};

export default function TransactionsPage() {
  const { data } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getJson<Transaction[]>("/transactions?householdId=1"),
  });

  return (
    <Layout>
      <Card className="border-white/70 bg-white/90">
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>Movimentações salvas pelo WhatsApp e pelo painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    {new Date(item.transactionDate).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        item.type === "income"
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-rose-500"
                      }
                    >
                      {item.type === "income" ? "+" : "-"}
                      {formatCurrency(Number(item.amount))}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}
