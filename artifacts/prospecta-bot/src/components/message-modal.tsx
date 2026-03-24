import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLeadMessage } from "@/hooks/use-leads";
import { Copy, ExternalLink, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@workspace/api-client-react";

interface MessageModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export function MessageModal({ lead, onClose }: MessageModalProps) {
  const { data: messageData, isLoading, isError } = useLeadMessage(lead?.id || null);
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleOpenWhatsApp = () => {
    if (messageData?.whatsappUrl) {
      window.open(messageData.whatsappUrl, '_blank');
    }
  };

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border shadow-2xl glass">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Estratégia de Abordagem
          </DialogTitle>
          <DialogDescription>
            Mensagem personalizada e prompt gerados por IA para <span className="text-primary font-medium">{lead?.nomeEmpresa}</span>.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p>Gerando estratégia personalizada com IA...</p>
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-destructive">
            <p>Erro ao carregar a mensagem. Tente novamente mais tarde.</p>
          </div>
        ) : messageData ? (
          <div className="grid gap-6 py-4">
            {/* WhatsApp Message Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  1. Mensagem de Conexão (WhatsApp)
                </h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={() => handleCopy(messageData.mensagem, "Mensagem")}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" /> Copiar
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-8 bg-[#25D366] hover:bg-[#20bd5a] text-white border-none"
                    onClick={handleOpenWhatsApp}
                    disabled={!messageData.whatsappUrl}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-2" /> Abrir no Web
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Textarea 
                  readOnly 
                  value={messageData.mensagem}
                  className="min-h-[150px] resize-none bg-background/50 font-mono text-sm border-border/50 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  2. Prompt para Demo (Claude/v0)
                </h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  onClick={() => handleCopy(messageData.promptDemo, "Prompt")}
                >
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copiar Prompt
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cole este prompt em uma IA geradora de código (como v0 ou Bolt) para criar uma landing page demonstrativa.
              </p>
              <Textarea 
                readOnly 
                value={messageData.promptDemo}
                className="min-h-[120px] resize-none bg-background/50 font-mono text-sm border-border/50 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter className="sm:justify-end">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
