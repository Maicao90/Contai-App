import { db, pendingDecisionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
// Need inline Identity type directly or handled via generic
export type LocalIdentity = any;
import { getFlowDefinition } from "./flows/definitions";
import { VALIDATORS } from "./validators";

export async function processContextualResponse(
  identity: LocalIdentity,
  message: string,
  pending: any
): Promise<{ resolved: boolean; reply?: string; parsedData?: any }> {
  const flow = getFlowDefinition(pending.action);
  if (!flow) {
    // Fallback if no explicit flow
    return { resolved: false };
  }

  const currentStep = flow.steps[pending.step];
  
  if (!currentStep) {
      return { resolved: true, parsedData: pending.accumulatedData };
  }

  let value: any = undefined;

  // Validate response
  if (currentStep.validator === "currency") {
    value = VALIDATORS.currency(message);
  } else if (currentStep.validator === "paymentMethod") {
    value = VALIDATORS.paymentMethod(message);
  } else if (currentStep.validator === "category") {
    value = await VALIDATORS.category(message, identity.household.id);
  } else if (currentStep.validator === "date") {
    value = VALIDATORS.date(message, identity.user.timezone || "America/Sao_Paulo");
  } else if (currentStep.validator === "text") {
    value = VALIDATORS.text(message);
  } else if (currentStep.validator === "fiscalContext") {
    value = VALIDATORS.fiscalContext(message);
  } else if (currentStep.validator === "accountType") {
    value = VALIDATORS.accountType(message);
  }
  
  if (value === null && currentStep.required) {
    return { resolved: false, reply: `⚠️ Resposta inválida. Por favor, forneça um dado válido para:\n\n${currentStep.question}` };
  }
  
  // Accumulate data
  const accumulated = { ...pending.accumulatedData };
  
  if (value !== null && value !== undefined && value !== "") {
     accumulated[currentStep.key] = value;
  }

  const nextStepIndex = pending.step + 1;
  const nextStep = flow.steps[nextStepIndex];
  
  // Complete flow
  if (!nextStep) {
    return { resolved: true, parsedData: accumulated };
  } 

  // Advance to next step
  await db.update(pendingDecisionsTable)
    .set({
      step: nextStepIndex,
      accumulatedData: accumulated,
      question: nextStep.question,
    })
    .where(eq(pendingDecisionsTable.id, pending.id));
    
  return { resolved: false, reply: nextStep.question };
}

export function initializeFlowState(action: string, parsed: any) {
   const flow = getFlowDefinition(action);
   if (!flow) return { step: 0, accumulatedData: parsed, question: "..." };
   
   let startStep = 0;
   const accu: any = { ...parsed };
   
   for (let i = 0; i < flow.steps.length; i++) {
      const stepConfig = flow.steps[i];
      if (accu[stepConfig.key] == null && stepConfig.required) {
         startStep = i;
         break;
      }
   }
   
   return { 
      step: startStep, 
      accumulatedData: accu, 
      question: flow.steps[startStep]?.question || "Mais alguma coisa?" 
   };
}
