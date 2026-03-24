import { useQueryClient } from "@tanstack/react-query";
import { 
  useListLeads, 
  useGetLeadStats, 
  useMineLeads, 
  useUpdateLead, 
  useGetLeadMessage,
  getListLeadsQueryKey,
  getGetLeadStatsQueryKey,
  ListLeadsParams
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useLeadsData(params?: ListLeadsParams) {
  return useListLeads(params, {
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  });
}

export function useLeadsStats() {
  return useGetLeadStats({
    query: {
      staleTime: 1000 * 60 * 5,
    }
  });
}

export function useLeadMessage(leadId: number | null) {
  return useGetLeadMessage(leadId as number, {
    query: {
      enabled: !!leadId,
      staleTime: Infinity, // Message shouldn't change often
    }
  });
}

export function useLeadsMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mineMutation = useMineLeads({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
        toast({
          title: "Mineração Concluída!",
          description: `Encontramos ${data.found} novos leads com sucesso.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro na mineração",
          description: error?.message || "Ocorreu um erro ao buscar leads.",
          variant: "destructive"
        });
      }
    }
  });

  const updateMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
        toast({
          title: "Status atualizado",
          description: "O lead foi atualizado com sucesso.",
        });
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o lead.",
          variant: "destructive"
        });
      }
    }
  });

  return {
    mineLeads: mineMutation,
    updateLead: updateMutation
  };
}
