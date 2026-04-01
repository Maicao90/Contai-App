import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NotificationTemplateKey } from "./notifications";

export type EmailTemplateDefinition = {
  key: NotificationTemplateKey;
  title: string;
  description: string;
  subject: string;
  text: string;
  html: string;
};

const settingsPath = path.resolve(process.cwd(), ".data", "email-templates.json");

const defaultTemplates: Record<NotificationTemplateKey, EmailTemplateDefinition> = {
  welcome: {
    key: "welcome",
    title: "Boas-vindas",
    description: "Enviado quando a conta e criada com sucesso.",
    subject: "Bem-vindo ao Contai, {{userName}}",
    text: "Oi {{userName}}, sua conta no Contai foi criada com sucesso.\n\nAgora voce ja pode registrar gastos, contas, receitas e compromissos pelo WhatsApp.\n\nEntrar no painel: {{appBaseUrl}}/login",
    html: "<p>Oi {{userName}}, sua conta no <strong>Contai</strong> foi criada com sucesso.</p><p>Agora voce ja pode registrar gastos, contas, receitas e compromissos pelo WhatsApp.</p><p><a href=\"{{appBaseUrl}}/login\">Entrar no painel</a></p>",
  },
  password_reset_requested: {
    key: "password_reset_requested",
    title: "Redefinicao de senha",
    description: "Enviado quando a pessoa pede para redefinir a senha.",
    subject: "Redefina sua senha no Contai",
    text: "Oi {{userName}}, recebemos um pedido para redefinir sua senha.\n\nUse este link para criar uma nova senha:\n{{resetUrl}}\n\nSe voce nao pediu essa alteracao, pode ignorar este e-mail.",
    html: "<p>Oi {{userName}}, recebemos um pedido para redefinir sua senha.</p><p><a href=\"{{resetUrl}}\">Criar nova senha</a></p><p>Se voce nao pediu essa alteracao, pode ignorar este e-mail.</p>",
  },
  password_changed: {
    key: "password_changed",
    title: "Senha alterada",
    description: "Confirma alteracao de senha da conta.",
    subject: "Sua senha do Contai foi alterada",
    text: "Oi {{userName}}, sua senha foi alterada com sucesso.\n\nSe nao foi voce, troque a senha novamente e fale com o suporte do Contai.",
    html: "<p>Oi {{userName}}, sua senha foi alterada com sucesso.</p><p>Se nao foi voce, troque a senha novamente e fale com o suporte do Contai.</p>",
  },
  payment_confirmed: {
    key: "payment_confirmed",
    title: "Pagamento confirmado",
    description: "Confirma pagamento aprovado.",
    subject: "Pagamento confirmado no Contai",
    text: "Oi {{userName}}, recebemos seu pagamento e o acesso ao Plano Contai esta ativo.\n\nValor confirmado: {{amountLabel}}\nCiclo atual: {{cycleLabel}}\n\nAcessar painel: {{appBaseUrl}}/login",
    html: "<p>Oi {{userName}}, recebemos seu pagamento e o acesso ao <strong>Plano Contai</strong> esta ativo.</p><p><strong>Valor confirmado:</strong> {{amountLabel}}</p><p><strong>Ciclo atual:</strong> {{cycleLabel}}</p><p><a href=\"{{appBaseUrl}}/login\">Acessar painel</a></p>",
  },
  payment_overdue: {
    key: "payment_overdue",
    title: "Pagamento em atraso",
    description: "Avisa quando a conta esta em atraso.",
    subject: "Seu pagamento do Contai precisa de atencao",
    text: "Oi {{userName}}, identificamos um atraso no pagamento do Contai.\n\nData de referencia: {{renewalDate}}\n\nRegularize para continuar usando o WhatsApp, o painel e as integracoes normalmente.\n{{appBaseUrl}}/assinatura",
    html: "<p>Oi {{userName}}, identificamos um atraso no pagamento do Contai.</p><p><strong>Data de referencia:</strong> {{renewalDate}}</p><p>Regularize para continuar usando o WhatsApp, o painel e as integracoes normalmente.</p><p><a href=\"{{appBaseUrl}}/assinatura\">Ver minha assinatura</a></p>",
  },
  plan_changed: {
    key: "plan_changed",
    title: "Troca de plano",
    description: "Confirma mudanca entre mensal e anual.",
    subject: "Seu plano do Contai foi atualizado",
    text: "Oi {{userName}}, sua forma de cobranca do Contai foi atualizada com sucesso.\n\nPlano anterior: {{previousCycleLabel}}\nPlano atual: {{newCycleLabel}}\n\nAcompanhar assinatura: {{appBaseUrl}}/app/assinatura",
    html: "<p>Oi {{userName}}, sua forma de cobranca do Contai foi atualizada com sucesso.</p><p><strong>Plano anterior:</strong> {{previousCycleLabel}}</p><p><strong>Plano atual:</strong> {{newCycleLabel}}</p><p><a href=\"{{appBaseUrl}}/app/assinatura\">Acompanhar assinatura</a></p>",
  },
  monthly_report: {
    key: "monthly_report",
    title: "Relatorio mensal",
    description: "Entrega o resumo do mes por e-mail.",
    subject: "Seu relatorio mensal do Contai",
    text: "Oi {{userName}}, seu relatorio mensal do Contai esta pronto.\n\n{{reportSummary}}\n\nVer relatorios: {{appBaseUrl}}/app/relatorios",
    html: "<p>Oi {{userName}}, seu relatorio mensal do Contai esta pronto.</p><p>{{reportSummary}}</p><p><a href=\"{{appBaseUrl}}/app/relatorios\">Ver relatorios no painel</a></p>",
  },
  meeting_scheduled: {
    key: "meeting_scheduled",
    title: "Compromisso agendado",
    description: "Confirma compromisso salvo e sincronizado.",
    subject: "Compromisso confirmado no Contai",
    text: "Oi {{userName}}, seu compromisso foi confirmado no Contai.\n\nCompromisso: {{meetingTitle}}\nData: {{meetingDate}}\n\n{{googleCalendarStatusLine}}",
    html: "<p>Oi {{userName}}, seu compromisso foi confirmado no Contai.</p><p><strong>Compromisso:</strong> {{meetingTitle}}</p><p><strong>Data:</strong> {{meetingDate}}</p><p>{{googleCalendarStatusLine}}</p>",
  },
  shared_account_added: {
    key: "shared_account_added",
    title: "Convite de Conta Compartilhada",
    description: "Enviado quando um novo membro e adicionado a uma conta.",
    subject: "{{ownerName}} te convidou para o Contai!",
    text: "Oi {{userName}}, você foi convidado(a) por {{ownerName}} para compartilhar a conta no Contai!\n\nAgora você pode registrar seus gastos e compromissos pelo seu próprio WhatsApp.\n\nSeus dados de acesso:\nLogin: {{userEmail}}\nSenha: {{userPassword}}\n\nFalar com o Robô no WhatsApp: {{robotUrl}}\n\nEntrar no painel: {{appBaseUrl}}/login",
    html: "<p>Oi {{userName}}, você foi convidado(a) por <strong>{{ownerName}}</strong> para compartilhar a conta no <strong>Contai</strong>!</p><p>Agora você pode registrar seus gastos e compromissos pelo seu próprio WhatsApp.</p><p><strong>Seus dados de acesso:</strong><br />Login: <code>{{userEmail}}</code><br />Senha: <code>{{userPassword}}</code></p><p><a href=\"{{robotUrl}}\" style=\"display:inline-block;padding:12px 24px;background:#25d366;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;\">Falar com o Robô no WhatsApp</a></p><p><a href=\"{{appBaseUrl}}/login\">Entrar no painel administrativo</a></p>",
  },
};

export const emailTemplates: Record<NotificationTemplateKey, EmailTemplateDefinition> = JSON.parse(
  JSON.stringify(defaultTemplates),
) as Record<NotificationTemplateKey, EmailTemplateDefinition>;

let loaded = false;

async function ensureStore() {
  await mkdir(path.dirname(settingsPath), { recursive: true });
}

async function readStore(): Promise<Partial<Record<NotificationTemplateKey, Partial<EmailTemplateDefinition>>>> {
  try {
    const raw = await readFile(settingsPath, "utf8");
    return JSON.parse(raw) as Partial<Record<NotificationTemplateKey, Partial<EmailTemplateDefinition>>>;
  } catch {
    return {};
  }
}

async function writeStore() {
  await ensureStore();
  await writeFile(settingsPath, JSON.stringify(emailTemplates, null, 2), "utf8");
}

export async function loadEmailTemplates() {
  if (loaded) {
    return emailTemplates;
  }

  const stored = await readStore();
  for (const key of Object.keys(defaultTemplates) as NotificationTemplateKey[]) {
    Object.assign(emailTemplates[key], stored[key] ?? {});
  }
  loaded = true;
  return emailTemplates;
}

export function getEmailTemplate(key: NotificationTemplateKey) {
  return emailTemplates[key];
}

export function listEmailTemplates() {
  return (Object.keys(emailTemplates) as NotificationTemplateKey[]).map((key) => emailTemplates[key]);
}

export async function updateEmailTemplate(
  key: NotificationTemplateKey,
  values: Partial<Pick<EmailTemplateDefinition, "title" | "description" | "subject" | "text" | "html">>,
) {
  await loadEmailTemplates();
  Object.assign(emailTemplates[key], values);
  await writeStore();
  return emailTemplates[key];
}
