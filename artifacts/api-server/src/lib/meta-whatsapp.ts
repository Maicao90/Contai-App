type SendWhatsAppTextInput = {
  to: string;
  body: string;
};

const META_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";

export async function sendWhatsAppText({ to, body }: SendWhatsAppTextInput) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { sent: false, reason: "missing_config" as const };
  }

  const response = await fetch(
    `https://graph.facebook.com/${META_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body,
        },
      }),
    },
  );

  if (!response.ok) {
    return {
      sent: false,
      reason: "meta_error" as const,
      details: await response.text(),
    };
  }

  return { sent: true };
}
