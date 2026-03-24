import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, Badge, Button, Input, Select } from "@/components/ui/shared";
import { Modal } from "@/components/ui/modal";
import { 
  useListCampaigns, 
  useCreateCampaign, 
  useMineLeads,
  getListCampaignsQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, Users, MapPin, Loader2, Play, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NICHOS, getConversao, conversaoBadgeColor } from "@/lib/nichos";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function Campanhas() {
  const { data: campaigns, isLoading } = useListCampaigns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreateCampaign();
  const mineMutation = useMineLeads();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      nicho: formData.get("nicho") as string,
      cidade: formData.get("cidade") as string,
      uf: formData.get("uf") as string,
    };

    try {
      setIsMining(true);
      // 1. Create Campaign
      const campaign = await createMutation.mutateAsync({ data });
      
      // 2. Mine Leads
      const result = await mineMutation.mutateAsync({ 
        data: { nicho: data.nicho, cidade: data.cidade, campanhaId: campaign.id } 
      });

      toast({ 
        title: "Campanha Criada!", 
        description: `Mineração concluída. ${result.found} leads encontrados.`,
        variant: "success"
      });
      
      queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao criar campanha ou minerar leads.", variant: "destructive" });
    } finally {
      setIsMining(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Campanhas</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas máquinas de prospecção.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-5 h-5" /> Nova Campanha
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <Card key={i} className="h-48 animate-pulse bg-card/50" />
            ))}
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma campanha</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Crie sua primeira campanha para iniciar a mineração de leads e popular seu funil.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>Criar Primeira Campanha</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns?.map((camp) => (
              <Card key={camp.id} className="p-6 flex flex-col hover:border-primary/30 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-1" title={camp.nome}>{camp.nome}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {camp.cidade}, {camp.uf}
                    </div>
                  </div>
                  <Badge variant={camp.status === 'Ativa' ? 'success' : camp.status === 'Pausada' ? 'warning' : 'default'}>
                    {camp.status}
                  </Badge>
                </div>
                
                <div className="mb-6 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-background/50">{camp.nicho}</Badge>
                  {(() => {
                    const taxa = getConversao(camp.nicho);
                    if (!taxa) return null;
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold ${conversaoBadgeColor(taxa)}`}>
                        <TrendingUp className="w-3 h-3" />
                        {taxa}% conv.
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 mt-auto bg-background/30 p-3 rounded-xl border border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Leads</p>
                    <p className="font-display font-bold text-xl text-white">{camp.totalLeads}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Conversão</p>
                    <p className="font-display font-bold text-xl text-primary">{camp.taxaConversao ? `${camp.taxaConversao}%` : '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(camp.dataCriacao), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                  <Link href={`/leads?campanhaId=${camp.id}`} className="text-sm font-semibold text-white group-hover:text-primary transition-colors flex items-center gap-1">
                    Ver Leads &rarr;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => !isMining && setIsModalOpen(false)} title="Nova Campanha">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome da Campanha</label>
              <Input name="nome" required placeholder="Ex: Dentistas SP Capital" disabled={isMining} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nicho de Mercado</label>
              <Select name="nicho" required disabled={isMining}>
                <option value="">Selecione o nicho</option>
                {NICHOS.map(n => (
                  <option key={n.nome} value={n.nome}>
                    {n.nome} — {n.conversao}% conversão
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Ordenados por maior taxa de conversão histórica.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Cidade</label>
                <Input name="cidade" required placeholder="Ex: São Paulo" disabled={isMining} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">UF</label>
                <Select name="uf" required disabled={isMining} defaultValue="SP">
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full h-12 text-lg relative overflow-hidden" disabled={isMining}>
                {isMining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin relative z-10" />
                    <span className="relative z-10">Minerando oportunidades...</span>
                    {/* Animated scanning bar background */}
                    <div className="absolute inset-0 bg-primary/20">
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" /> Iniciar Mineração
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                O bot buscará negócios no Google Maps, extrairá contatos e analisará a presença digital automaticamente.
              </p>
            </div>
          </form>
        </Modal>

      </div>
    </Layout>
  );
}
