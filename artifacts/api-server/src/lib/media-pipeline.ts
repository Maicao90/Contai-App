import {
  analyzeImageWithOpenAI,
  transcribeAudioWithOpenAI,
  type ImageExtractionResult,
} from "./openai-client";

type MessageKind = "text" | "audio" | "image";

type IncomingMediaPayload = {
  messageType: MessageKind;
  content?: string;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
};

export type NormalizedInboundContent = {
  kind: MessageKind;
  normalizedText: string;
  rawText?: string;
  extracted?: ImageExtractionResult | null;
  extractions?: Array<{
    normalizedText: string;
    extracted: any;
  }>;
  needsUserInput?: boolean;
  userPrompt?: string | null;
};

const META_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";

async function downloadMedia(mediaId: string) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return null;
  }

  const metaResponse = await fetch(
    `https://graph.facebook.com/${META_VERSION}/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!metaResponse.ok) {
    return null;
  }

  const metaJson = (await metaResponse.json()) as { url?: string; mime_type?: string };
  if (!metaJson.url) {
    return null;
  }

  const fileResponse = await fetch(metaJson.url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!fileResponse.ok) {
    return null;
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  return {
    mimeType:
      metaJson.mime_type ??
      fileResponse.headers.get("content-type") ??
      "application/octet-stream",
    base64: Buffer.from(arrayBuffer).toString("base64"),
  };
}

export async function normalizeInboundContent(
  payload: IncomingMediaPayload,
): Promise<NormalizedInboundContent> {
  if (payload.messageType === "text") {
    return {
      kind: "text",
      normalizedText: payload.content?.trim() ?? "",
      rawText: payload.content?.trim() ?? "",
      extracted: null,
      needsUserInput: false,
      userPrompt: null,
    };
  }

  const media = payload.mediaId ? await downloadMedia(payload.mediaId) : null;

  if (payload.messageType === "audio") {
    const transcription =
      media && media.mimeType
        ? await transcribeAudioWithOpenAI(media.base64, media.mimeType)
        : null;

    return {
      kind: "audio",
      normalizedText: transcription ?? "",
      rawText: transcription ?? "",
      extracted: null,
      needsUserInput: !transcription,
      userPrompt: transcription ? null : "Não consegui transcrever esse áudio. Pode mandar em texto?",
    };
  }

  const { data: extracted, usage } =
    media && media.mimeType
      ? await analyzeImageWithOpenAI(media.base64, media.mimeType)
      : { data: null };

  if (extracted && extracted.transacoes.length > 0 && extracted.confianca >= 0.6) {
    const extractions = extracted.transacoes.map((t) => {
      const action = t.tipo === "receita" ? "recebi" : "gastei";
      const description = t.descricao?.trim() || "comprovante";
      return {
        normalizedText: `${action} ${t.valor} com ${description}`,
        extracted: t,
      };
    });

    return {
      kind: "image",
      normalizedText: extractions.map((e) => e.normalizedText).join(". "),
      rawText: payload.caption?.trim() ?? "",
      extracted,
      extractions,
      needsUserInput: false,
      userPrompt: null,
    };
  }

  return {
    kind: "image",
    normalizedText: payload.caption?.trim() ?? "",
    rawText: payload.caption?.trim() ?? "",
    extracted: extracted,
    needsUserInput: true,
    userPrompt: "Não consegui identificar nenhum valor legível. Poderia me informar o que foi?",
  };
}
