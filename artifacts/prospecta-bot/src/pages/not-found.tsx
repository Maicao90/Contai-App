import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/shared";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">P\u00e1gina n\u00e3o encontrada</p>
        <Link href="/">
          <Button size="lg">Voltar ao Dashboard</Button>
        </Link>
      </div>
    </Layout>
  );
}
