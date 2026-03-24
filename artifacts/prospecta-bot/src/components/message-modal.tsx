import { useState, useEffect } from "react";
import { Modal } from "./ui/modal";
import { Button, Textarea, Select, Badge } from "./ui/shared";
import { Copy, MessageCircle, ExternalLink, ChevronDown, Check, Loader2 } from "lucide-react";
import { Lead, LeadStatus } from "@workspace/api-client-react";
import { useGetLeadMessage, useUpdateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListLeadsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MessageModal({ lead, isOpen, onClose }: MessageModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(lead?.status || "Novo");

  const { data: msgData, isLoading } = useGetLeadMessage(lead?.id || 0, {
    query: { enabled: !!lead?.id && isOpen }
  });

  const updateMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Status atualizado!", variant: "success" });
      }
    }
  });

  useEffect(() => {
    if (lead) setStatus(lead.status);
    setShowPrompt(false);
  }, [lead, isOpen]);

  const handleStatusChange = (newStatus: LeadStatus) => {
    setStatus(newStatus);
    if (lead) {
      updateMutation.mutate({ id: lead.id, data: { status: newStatus } });
    }
  };

  const copyToClipboard = async (text: string, type: 'msg' | 'prompt') => {
    await navigator.clipboard.writeText(text);
    if (type === 'msg') {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    } else {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
    toast({ title: "Copiado para a área de transferência!" });
  };

  if (!lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Lead"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-background/50 p-4 rounded-xl border border-border">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {lead.nomeEmpresa}
              <Badge variant={lead.temperatura === 'Quente' ? 'danger' : lead.temperatura === 'Morno' ? 'warning' : 'info'}>
                {lead.temperatura}
              </Badge>
            </h3>
            <p className="text-muted-foreground text-sm mt-1">{lead.nicho} • {lead.cidade}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {!lead.temSite ? (
                <Badge variant="danger">❌ Sem Site</Badge>
              ) : (
                <Badge variant="success">✅ Site Encontrado</Badge>
              )}
              {!lead.temPixelMeta && <Badge variant="warning">❌ Sem Pixel Meta</Badge>}
              {!lead.temPixelGoogle && <Badge variant="warning">❌ Sem Pixel Google</Badge>}
            </div>
          </div>
          
          <div className="text-center bg-card p-3 rounded-xl border border-border min-w-[100px]">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Score</p>
            <p className="text-3xl font-display font-bold text-primary">{lead.score}</p>
          </div>
        </div>

        {/* Message Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Mensagem de Abordagem
            </h4>
            <div className="flex items-center gap-2">
              <Select 
                value={status} 
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="h-8 py-1 px-3 text-xs w-auto min-w-[120px]"
                disabled={updateMutation.isPending}
              >
                <option value="Novo">Novo</option>
                <option value="Contatado">Contatado</option>
                <option value="Convertido">Convertido</option>
              </Select>
            </div>
          </div>
          
          <div className="relative">
            {isLoading ? (
              <div className="h-40 w-full bg-background/50 border-2 border-input rounded-xl flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Gerando mensagem com IA...</p>
              </div>
            ) : (
              <Textarea 
                readOnly
                value={msgData?.mensagem || ""}
                className="h-48 font-sans text-sm leading-relaxed bg-black/20"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              disabled={isLoading || !msgData}
              onClick={() => copyToClipboard(msgData?.mensagem || "", 'msg')}
            >
              {copiedMsg ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedMsg ? "Copiado!" : "Copiar Mensagem"}
            </Button>
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              disabled={isLoading || !msgData || !msgData.whatsappUrl}
              onClick={() => {
                if (msgData?.whatsappUrl) {
                  window.open(msgData.whatsappUrl, '_blank');
                  if (status === "Novo") handleStatusChange("Contatado");
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir no WhatsApp
            </Button>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="border border-border rounded-xl overflow-hidden bg-background/30">
          <button 
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            onClick={() => setShowPrompt(!showPrompt)}
          >
            <span className="font-semibold text-sm">Prompt para Landing Page (Demo)</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", showPrompt && "rotate-180")} />
          </button>
          
          <AnimatePresence>
            {showPrompt && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3">
                    Copie este prompt e cole no Lovable, v0.dev ou Bolt.new para gerar uma página de demonstração para este cliente antes da reunião.
                  </p>
                  <div className="relative group">
                    <Textarea 
                      readOnly
                      value={msgData?.promptDemo || ""}
                      className="min-h-[100px] text-xs font-mono bg-black/40"
                    />
                    <Button 
                      size="sm" 
                      variant="glass" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(msgData?.promptDemo || "", 'prompt')}
                    >
                      {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
