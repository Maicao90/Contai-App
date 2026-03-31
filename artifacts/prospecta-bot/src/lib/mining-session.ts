import { mineLeads as mineLeadsRequest } from "@workspace/api-client-react";

export type Mercado = "Nacional" | "Internacional";
export type MiningStage = "collecting" | "validating" | "saving" | "completed";

export interface CampaignMiningTarget {
  id: number;
  nome: string;
  mercado: Mercado;
  nicho: string;
  preferenciaSite?: "todos" | "com-site" | "sem-site";
  pais?: string | null;
  cidade: string;
  uf: string;
}

export interface ActiveMiningState {
  campaignId: number;
  nome: string;
  nicho: string;
  cidade: string;
  uf: string;
  pais: string | null;
  mercado: Mercado;
  startedAt: number;
  foundLeads: number;
  whatsappLeads: number;
  verifiedWhatsappLeads: number;
  stage: MiningStage;
}

interface MiningSessionSnapshot {
  isMining: boolean;
  activeMining: ActiveMiningState | null;
}

type MiningListener = (snapshot: MiningSessionSnapshot) => void;

let controller: AbortController | null = null;
let snapshot: MiningSessionSnapshot = {
  isMining: false,
  activeMining: null,
};

const listeners = new Set<MiningListener>();

function emit() {
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function setSnapshot(next: MiningSessionSnapshot) {
  snapshot = next;
  emit();
}

export function getMiningSessionSnapshot(): MiningSessionSnapshot {
  return snapshot;
}

export function subscribeMiningSession(listener: MiningListener): () => void {
  listeners.add(listener);
  listener(snapshot);

  return () => {
    listeners.delete(listener);
  };
}

export async function startCampaignMining(target: CampaignMiningTarget) {
  if (controller) {
    throw new Error("MINING_ALREADY_RUNNING");
  }

  controller = new AbortController();

  setSnapshot({
    isMining: true,
    activeMining: {
      campaignId: target.id,
      nome: target.nome,
      mercado: target.mercado,
      nicho: target.nicho,
      cidade: target.cidade,
      uf: target.uf,
      pais: target.pais ?? null,
      startedAt: Date.now(),
      foundLeads: 0,
      whatsappLeads: 0,
      verifiedWhatsappLeads: 0,
      stage: "collecting",
    },
  });

  try {
    const result = await mineLeadsRequest(
      {
        mercado: target.mercado,
        nicho: target.nicho,
        preferenciaSite: target.preferenciaSite ?? "todos",
        pais: target.pais ?? null,
        cidade: target.cidade,
        uf: target.uf,
        campanhaId: target.id,
      } as any,
      { signal: controller.signal },
    );

    setSnapshot({
      isMining: true,
      activeMining: snapshot.activeMining
        ? {
            ...snapshot.activeMining,
            foundLeads: result.found,
            whatsappLeads: result.leads.filter((lead) => Boolean(lead.whatsapp)).length,
            verifiedWhatsappLeads: result.leads.filter((lead) => lead.whatsappVerificado).length,
            stage: "completed",
          }
        : null,
    });

    return result;
  } finally {
    controller = null;
  }
}

export function stopCampaignMining() {
  if (!controller) {
    return false;
  }

  controller.abort();
  controller = null;
  setSnapshot({
    isMining: false,
    activeMining: null,
  });
  return true;
}

export function clearMiningSession() {
  setSnapshot({
    isMining: false,
    activeMining: null,
  });
}
