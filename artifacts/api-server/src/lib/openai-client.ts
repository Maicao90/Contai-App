import { systemSettings } from "./system-settings";

type AIParsedIntent =
  | "registrar_gasto"
  | "registrar_receita"
  | "registrar_conta"
  | "registrar_compromisso"
  | "registrar_lembrete"
  | "consulta_resumo"
  | "consulta_historico"
  | "consulta_categoria"
  | "saudacao"
  | "ajuda"
  | "reset_dados"
  | "registrar_meta"
  | "indefinido";

export type AIParsedMessage = {
  intent: AIParsedIntent;
  valor?: number | null;
  categoria?: string | null;
  descricao?: string | null;
  titulo?: string | null;
  data?: string | null;
  observacoes?: string | null;
  visibilidade?: "shared" | "personal" | null;
};

export type ImageExtractionResult = {
  tipo: "gasto" | "receita";
  valor: number | null;
  categoria?: string | null;
  descricao?: string | null;
  confianca: number;
};

const OPENAI_API_URL = "https://api.openai.com/v1";
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
const VISION_MODEL = process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini";
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe";

const TEXT_SYSTEM_PROMPT = [
  "Voce interpreta mensagens de WhatsApp em portugues do Brasil para o Contai, um assistente de organizacao financeira e de rotina.",
  "Responda somente com JSON valido no schema informado.",
  "Classifique a mensagem em uma unica intencao.",
  "Intencoes possiveis:",
  "- registrar_gasto: compra, pagamento, despesa ou saida de dinheiro.",
  "- registrar_receita: entrada de dinheiro, recebimento, salario, pix recebido ou pagamento recebido.",
  "- registrar_conta: conta, boleto, fatura, mensalidade, vencimento ou algo a pagar ou receber depois.",
  "- registrar_compromisso: evento com data ou horario, como consulta, reuniao, exame, viagem ou visita.",
  "- registrar_lembrete: algo para lembrar depois, mesmo sem ser evento formal.",
  "- consulta_resumo: pedido de saldo, resumo, total gasto ou total recebido.",
  "- consulta_historico: pedido de ultimas movimentacoes ou historico.",
  "- consulta_categoria: pergunta sobre uma categoria especifica.",
  "- saudacao: oi, ola, bom dia, boa tarde, boa noite.",
  "- ajuda: pergunta sobre o que o Contai faz ou como usar.",
  "- reset_dados: pedido para zerar as contas, limpar todos os dados, resetar o histórico ou apagar tudo para começar de novo.",
  "- registrar_meta: definir um limite mensal de gastos para uma categoria. Ex: 'minha meta de mercado é 1000 reais', 'limite de 200 pra lazer'.",
  "- indefinido: quando realmente nao der para classificar.",
  "Regras de extracao:",
  "- valor deve ser numero em reais, usando ponto decimal e sem simbolo de moeda.",
  "- categoria deve ser curta e util, como Mercado, Alimentacao, Combustivel, Transporte, Internet, Aluguel, Farmacia, Saude, Lazer, Salario, Freela ou Outros.",
  "- descricao deve ser curta e objetiva para gastos e receitas.",
  "- titulo deve ser usado principalmente para conta, compromisso e lembrete.",
  "- data deve vir em formato ISO 8601 quando a mensagem trouxer informacao suficiente. Se nao houver informacao suficiente, retorne null.",
  "- observacoes deve guardar contexto util que nao cabe nos outros campos.",
  "- visibilidade so deve ser shared ou personal quando isso estiver claro na mensagem. Se nao estiver claro, retorne null.",
  "Regras de negocio do Contai:",
  "- se a mensagem mencionar casa, casal, familia, nosso, nossa, compartilhado, compartilhada ou da casa, isso pode indicar shared.",
  "- se a mensagem mencionar pessoal, individual, so meu, so minha, sozinho ou sozinha, isso pode indicar personal.",
  "- nao invente valor, categoria, data ou visibilidade.",
  "- para saudacao ou ajuda simples, retorne os demais campos como null.",
].join(" ");

const IMAGE_SYSTEM_PROMPT = [
  "Voce analisa imagens recebidas no WhatsApp para o Contai.",
  "Responda somente com JSON valido no schema informado.",
  "Identifique se a imagem representa gasto ou receita.",
  "Considere recibo, nota fiscal, comprovante de pix, comprovante bancario ou print financeiro.",
  "Extraia o valor principal quando estiver legivel.",
  "categoria deve ser curta e util.",
  "descricao deve ser curta e objetiva, preferencialmente com o nome do estabelecimento ou o tipo do comprovante.",
  "confianca deve ser numero entre 0 e 1.",
  "Se nao conseguir ler o valor com seguranca, retorne valor null e confianca baixa.",
].join(" ");

export function getBotPromptPreview() {
  return {
    textSystemPrompt: TEXT_SYSTEM_PROMPT,
    imageSystemPrompt: IMAGE_SYSTEM_PROMPT,
    effectiveTextPrompt: [
      TEXT_SYSTEM_PROMPT,
      systemSettings.botTextInterpretationPrompt?.trim() || "",
      "Data de referencia: <ISO_DATE>.",
    ]
      .filter(Boolean)
      .join(" "),
    effectiveImagePrompt: [IMAGE_SYSTEM_PROMPT, systemSettings.botImageInterpretationPrompt?.trim() || ""]
      .filter(Boolean)
      .join(" "),
    effectiveReplyPrompt: [
      "Voce reescreve respostas finais do Contai para o cliente em portugues do Brasil.",
      "Mantenha os fatos, valores, datas, categorias, emojis e estrutura principal corretos.",
      "Nao invente dados, nao mude numeros e nao remova confirmacoes importantes.",
      "Evite markdown desnecessario, mas preserve o negrito simples com um asterisco em cada lado apenas nos rotulos, como *Descricao:* e *Valor:*.",
      "Nao use links em markdown, nao use bullets com ponto ou hifen e nao use asteriscos fora dos rotulos.",
      "Se a resposta ja estiver boa, apenas melhore o tom e a clareza.",
      `Tom geral do bot: ${systemSettings.botTone}`,
      `Instrucoes extras do painel: ${systemSettings.botReplyPrompt}`,
    ].join(" "),
  };
}

function sanitizeReplyForWhatsApp(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/\*{3,}/g, "*")
    .replace(/^[•·▪◦]\s*/gm, "")
    .replace(/^\-\s+/gm, "")
    .replace(/^\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getApiKey() {
  return process.env.OPENAI_API_KEY?.trim();
}

async function openAIJsonRequest<T>(
  endpoint: string,
  body: string | FormData,
  headers: Record<string, string>,
): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const response = await fetch(`${OPENAI_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...headers,
    },
    body,
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function interpretTextWithOpenAI(
  text: string,
  referenceDate: string,
): Promise<AIParsedMessage | null> {
  const payload = {
    model: CHAT_MODEL,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "contai_interpretation",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            intent: {
              type: "string",
              enum: [
                "registrar_gasto",
                "registrar_receita",
                "registrar_conta",
                "registrar_compromisso",
                "registrar_lembrete",
                "consulta_resumo",
                "consulta_historico",
                "consulta_categoria",
                "saudacao",
                "ajuda",
                "reset_dados",
                "registrar_meta",
                "indefinido",
              ],
            },
            valor: { type: ["number", "null"] },
            categoria: { type: ["string", "null"] },
            descricao: { type: ["string", "null"] },
            titulo: { type: ["string", "null"] },
            data: { type: ["string", "null"] },
            observacoes: { type: ["string", "null"] },
            visibilidade: {
              type: ["string", "null"],
              enum: ["shared", "personal", null],
            },
          },
          required: [
            "intent",
            "valor",
            "categoria",
            "descricao",
            "titulo",
            "data",
            "observacoes",
            "visibilidade",
          ],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: [
          TEXT_SYSTEM_PROMPT,
          systemSettings.botTextInterpretationPrompt?.trim() || "",
          `Data de referencia: ${referenceDate}.`,
        ]
          .filter(Boolean)
          .join(" "),
      },
      {
        role: "user",
        content: text,
      },
    ],
  };

  const json = await openAIJsonRequest<{
    choices?: Array<{ message?: { content?: string } }>;
  }>(
    "/chat/completions",
    JSON.stringify(payload),
    {
      "Content-Type": "application/json",
    },
  );

  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AIParsedMessage;
  } catch {
    return null;
  }
}

export async function rewriteReplyWithOpenAI(
  draftReply: string,
  replyPrompt: string,
): Promise<string | null> {
  const payload = {
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: [
          "Voce reescreve respostas finais do Contai para o cliente em portugues do Brasil.",
          "Mantenha os fatos, valores, datas, categorias, emojis e estrutura principal corretos.",
          "Nao invente dados, nao mude numeros e nao remova confirmacoes importantes.",
          "Evite markdown desnecessario, mas preserve o negrito simples com um asterisco em cada lado apenas nos rotulos, como *Descricao:* e *Valor:*.",
          "Nao use links em markdown, nao use bullets com ponto ou hifen e nao use asteriscos fora dos rotulos.",
          "Se a resposta ja estiver boa, apenas melhore o tom e a clareza.",
          `Tom geral do bot: ${systemSettings.botTone}`,
          `Instrucoes extras do painel: ${replyPrompt}`,
        ].join(" "),
      },
      {
        role: "user",
        content: draftReply,
      },
    ],
  };

  const json = await openAIJsonRequest<{
    choices?: Array<{ message?: { content?: string } }>;
  }>(
    "/chat/completions",
    JSON.stringify(payload),
    {
      "Content-Type": "application/json",
    },
  );

  const rewritten = json?.choices?.[0]?.message?.content?.trim() || null;
  return rewritten ? sanitizeReplyForWhatsApp(rewritten) : null;
}

export async function transcribeAudioWithOpenAI(
  base64: string,
  mimeType: string,
): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const extension = mimeType.includes("ogg")
    ? "ogg"
    : mimeType.includes("wav")
      ? "wav"
      : mimeType.includes("mpeg")
        ? "mp3"
        : "audio";

  const blob = new Blob([Buffer.from(base64, "base64")], { type: mimeType });
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append("file", blob, `whatsapp-audio.${extension}`);
  form.append("language", "pt");

  const response = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as { text?: string };
  return json.text?.trim() ?? null;
}

export async function analyzeImageWithOpenAI(
  base64: string,
  mimeType: string,
): Promise<ImageExtractionResult | null> {
  const payload = {
    model: VISION_MODEL,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "contai_receipt_extraction",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            tipo: { type: "string", enum: ["gasto", "receita"] },
            valor: { type: ["number", "null"] },
            categoria: { type: ["string", "null"] },
            descricao: { type: ["string", "null"] },
            confianca: { type: "number" },
          },
          required: ["tipo", "valor", "categoria", "descricao", "confianca"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: [IMAGE_SYSTEM_PROMPT, systemSettings.botImageInterpretationPrompt?.trim() || ""]
          .filter(Boolean)
          .join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extraia os dados financeiros da imagem.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
  };

  const json = await openAIJsonRequest<{
    choices?: Array<{ message?: { content?: string } }>;
  }>(
    "/chat/completions",
    JSON.stringify(payload),
    {
      "Content-Type": "application/json",
    },
  );

  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ImageExtractionResult;
  } catch {
    return null;
  }
}
