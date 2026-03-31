import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "./ui/modal";
import { Button, Textarea, Select, Badge } from "./ui/shared";
import { Copy, MessageCircle, ExternalLink, ChevronDown, Check, Loader2, Globe, Flame, ThermometerSun, Snowflake, Code2 } from "lucide-react";
import { Lead, LeadStatus } from "@workspace/api-client-react";

import { useGetLeadMessage, useUpdateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListLeadsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildCanonicalWhatsappUrl } from "@/lib/whatsapp";

type PromptTab = "blueprint" | "generico" | "compacto";

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
  const [promptTab, setPromptTab] = useState<PromptTab>("blueprint");
  const [status, setStatus] = useState<LeadStatus>(lead?.status || "Novo");
  const [editedMessage, setEditedMessage] = useState("");

  const { data: msgData, isLoading } = useGetLeadMessage(lead?.id || 0, {
    query: { enabled: !!lead?.id && isOpen } as any
  });

  const data = msgData as any;

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
    setEditedMessage("");
  }, [lead, isOpen]);

  useEffect(() => {
    if (data?.mensagem && !editedMessage) {
      setEditedMessage(data.mensagem);
    }
  }, [data?.mensagem]);

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
    toast({ title: "Copiado!" });
  };

  const buildWhatsappUrl = () => {
    if (!data) return null;
    return buildCanonicalWhatsappUrl(lead?.whatsapp ?? lead?.telefone, editedMessage);
  };

  if (!lead) return null;

  const TemperaturaIcon = lead.temperatura === "Quente"
    ? Flame : lead.temperatura === "Morno"
    ? ThermometerSun : Snowflake;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Abordagem do Lead"
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-background/50 p-4 rounded-xl border border-border">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              {lead.nomeEmpresa}
              <Badge variant={lead.temperatura === 'Quente' ? 'danger' : lead.temperatura === 'Morno' ? 'warning' : 'info'} className="gap-1">
                <TemperaturaIcon className="w-3 h-3" />
                {lead.temperatura}
              </Badge>
            </h3>
            <p className="text-muted-foreground text-sm mt-1">{lead.nicho} • {lead.cidade}</p>
            {lead.telefone && (
              <p className="text-muted-foreground text-xs mt-1">📞 {lead.telefone}</p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {!lead.temSite ? (
                <Badge variant="danger">❌ Sem Site</Badge>
              ) : (
                <Badge variant="success">✅ Tem Site</Badge>
              )}
              <Badge variant={lead.temPixelMeta ? "success" : "warning"}>
                {lead.temPixelMeta ? "✅" : "❌"} Pixel Meta
              </Badge>
              <Badge variant={lead.temPixelGoogle ? "success" : "warning"}>
                {lead.temPixelGoogle ? "✅" : "❌"} Pixel Google
              </Badge>
            </div>
          </div>

          <div className="bg-card p-3 rounded-xl border border-border min-w-[110px] space-y-1.5">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider text-center">Oportunidade</p>
            <p className={`text-3xl font-display font-bold text-center ${lead.score >= 70 ? 'text-red-400' : lead.score >= 35 ? 'text-amber-400' : 'text-blue-400'}`}>
              {lead.score}<span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
            <div className="w-full bg-background/80 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${lead.score >= 70 ? 'bg-red-500' : lead.score >= 35 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${lead.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 gap-1.5 bg-background/30 rounded-xl p-3 border border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Por que esse índice?</p>
          {[
            { label: "Sem site próprio", pontos: 70, ativo: !lead.temSite },
            { label: "Sem Pixel Meta (anúncios)", pontos: 35, ativo: lead.temSite && !lead.temPixelMeta },
            { label: "Sem Pixel Google (analytics)", pontos: 20, ativo: lead.temSite && !lead.temPixelGoogle },
            { label: "Base — todo prospect tem valor", pontos: 15, ativo: true },
          ].map(({ label, pontos, ativo }) => (
            <div key={label} className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 ${ativo ? 'bg-primary/10 text-white' : 'text-muted-foreground/50 line-through'}`}>
              <span className={`text-base leading-none ${ativo ? 'text-emerald-400' : 'text-muted-foreground/30'}`}>{ativo ? '✓' : '—'}</span>
              <span className="flex-1">{label}</span>
              <span className={`font-mono font-bold ${ativo ? 'text-primary' : ''}`}>+{pontos}pts</span>
            </div>
          ))}
        </div>

        {/* Demo URL Banner */}
        {isLoading ? (
          <div className="h-12 bg-background/50 border border-border rounded-xl animate-pulse" />
        ) : data?.demoUrl ? (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Demo gerada para este lead</p>
              <p className="text-sm font-mono text-primary truncate">{data.demoUrl}</p>
            </div>
            <a
              href={data.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button size="sm" variant="outline" className="gap-1.5 text-xs border-primary/40 hover:border-primary">
                <ExternalLink className="w-3 h-3" />
                Abrir
              </Button>
            </a>
          </div>
        ) : null}

        {/* Message Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Mensagem de Abordagem
            </h4>
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

          <p className="text-xs text-muted-foreground">
            Edite a mensagem antes de enviar se quiser personalizar:
          </p>

          <div className="relative">
            {isLoading ? (
              <div className="h-48 w-full bg-background/50 border-2 border-input rounded-xl flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Gerando mensagem...</p>
              </div>
            ) : (
              <Textarea
                value={editedMessage}
                onChange={e => setEditedMessage(e.target.value)}
                className="h-52 font-sans text-sm leading-relaxed bg-black/20"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isLoading || !editedMessage}
              onClick={() => copyToClipboard(editedMessage, 'msg')}
            >
              {copiedMsg ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedMsg ? "Copiado!" : "Copiar"}
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              disabled={isLoading || !editedMessage || !buildWhatsappUrl()}
              onClick={() => {
                const url = buildWhatsappUrl();
                if (url) {
                  window.open(url, '_blank');
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs bg-[#f26207]/20 text-[#f26207] px-2 py-0.5 rounded-full font-semibold border border-[#f26207]/30">
                <Code2 className="w-3 h-3" />
                Replit Agent
              </span>
              <span className="font-semibold text-sm">Prompt para gerar a landing page</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", showPrompt && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showPrompt && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 border-t border-border/50 space-y-3">
                  <p className="text-xs text-muted-foreground pt-3">
                    Cole este prompt no <strong className="text-[#f26207]">Replit Agent</strong> para gerar a landing page antes de enviar a mensagem ao cliente. Escolha o nível de detalhe:
                  </p>

                  {/* Tab selector */}
                  <div className="flex gap-1 bg-background/60 p-1 rounded-lg border border-border/50">
                    {([
                      { key: "blueprint", label: "Blueprint", desc: "Detalhado" },
                      { key: "generico",  label: "Genérico",  desc: "Médio" },
                      { key: "compacto",  label: "Compacto",  desc: "Rápido" },
                    ] as const).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setPromptTab(tab.key)}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all",
                          promptTab === tab.key
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:text-white"
                        )}
                      >
                        {tab.label}
                        <span className={cn("block text-[10px] font-normal mt-0.5",
                          promptTab === tab.key ? "text-primary-foreground/70" : "text-muted-foreground/60"
                        )}>
                          {tab.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Prompt content */}
                  {(() => {
                    const prompts = (data as any)?.prompts;
                    const currentPrompt = prompts?.[promptTab] ?? data?.promptDemo ?? "";
                    return (
                      <>
                        <div className="relative group">
                          <Textarea
                            readOnly
                            value={currentPrompt}
                            className={cn(
                              "text-xs font-mono bg-black/40 leading-relaxed",
                              promptTab === "blueprint" ? "min-h-[220px]" :
                              promptTab === "generico"  ? "min-h-[160px]" : "min-h-[100px]"
                            )}
                          />
                          <Button
                            size="sm"
                            variant="glass"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(currentPrompt, 'prompt')}
                          >
                            {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full gap-2 text-sm"
                          onClick={() => copyToClipboard(currentPrompt, 'prompt')}
                        >
                          {copiedPrompt ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          {copiedPrompt ? "Prompt copiado!" : `Copiar Prompt ${promptTab === "blueprint" ? "Blueprint" : promptTab === "generico" ? "Genérico" : "Compacto"}`}
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
