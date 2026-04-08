export interface FlowStep {
  key: string;
  question: string;
  validator: string;
  required: boolean;
  default?: any;
}

export interface FlowDefinition {
  id: string;
  steps: FlowStep[];
}

export const TRANSACTION_FLOW: FlowDefinition = {
  id: 'register_transaction',
  steps: [
    {
      key: 'amount',
      question: '💰 Qual foi o valor?',
      validator: 'currency',
      required: true
    },
    {
      key: 'paymentMethod',
      question: '💳 Qual foi a forma de pagamento?\n\n' +
               '• Pix\n• Débito\n• Crédito\n• Dinheiro\n• Boleto',
      validator: 'paymentMethod',
      required: true
    },
    {
      key: 'category',
      question: '🏷️ Qual é a categoria?\n\n' +
               'Se quiser, digite uma nova ou pule.',
      validator: 'category',
      required: false,
      default: 'Outros'
    },
    {
      key: 'description',
      question: '📝 Quer adicionar uma descrição detalhada? (opcional)',
      validator: 'text',
      required: false,
      default: ''
    }
  ]
};

export const CONFIRM_HIGH_VALUE_FLOW: FlowDefinition = {
  id: 'confirm_high_value',
  steps: [
    {
      key: 'confirmed',
      question: 'Diga "Sim" para aprovar o lançamento ou "Não" para cancelar.',
      validator: 'boolean',
      required: true
    }
  ]
};

export const FLOWS: Record<string, FlowDefinition> = {
  register_expense: TRANSACTION_FLOW,
  register_income: TRANSACTION_FLOW,
  confirm_high_value: CONFIRM_HIGH_VALUE_FLOW
};

export function getFlowDefinition(intent: string): FlowDefinition | null {
   if (intent === 'registrar_gasto') return FLOWS['register_expense'];
   if (intent === 'registrar_receita') return FLOWS['register_income'];
   if (intent === 'confirm_high_value') return FLOWS['confirm_high_value'];
   return null;
}
