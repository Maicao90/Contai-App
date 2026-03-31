import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { getJson, patchJson } from "@/lib/api";

type MeResponse = {
  user: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    timezone: string;
    role: string;
  };
  member: {
    displayName: string;
  } | null;
  household: {
    id: number;
    name: string;
  } | null;
};

type UpdateResponse = MeResponse & {
  message: string;
};

export default function AppSettingsPage() {
  const { session, refresh } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "America/Sao_Paulo",
  });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["me-settings", session?.userId],
    queryFn: () => getJson<MeResponse>("/users/me"),
  });

  useEffect(() => {
    if (!data?.user) {
      return;
    }

    setProfileForm({
      name: data.user.name ?? "",
      email: data.user.email ?? "",
      phone: data.user.phone ?? "",
      timezone: data.user.timezone ?? "America/Sao_Paulo",
    });
  }, [data]);

  const updateProfile = useMutation({
    mutationFn: () =>
      patchJson<UpdateResponse>("/users/me", {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        timezone: profileForm.timezone,
      }),
    onSuccess: async (result) => {
      setProfileFeedback(result.message);
      await refresh();
    },
    onError: (error) => {
      setProfileFeedback(error instanceof Error ? error.message : "Não foi possível salvar os dados.");
    },
  });

  const updatePassword = useMutation({
    mutationFn: () =>
      patchJson<UpdateResponse>("/users/me", {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        timezone: profileForm.timezone,
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      }),
    onSuccess: async (result) => {
      setSecurityFeedback(result.message);
      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      await refresh();
    },
    onError: (error) => {
      setSecurityFeedback(error instanceof Error ? error.message : "Não foi possível trocar a senha.");
    },
  });

  function updateProfileField(field: keyof typeof profileForm, value: string) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function updateSecurityField(field: keyof typeof securityForm, value: string) {
    setSecurityForm((current) => ({ ...current, [field]: value }));
  }

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileFeedback(null);
    updateProfile.mutate();
  }

  function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecurityFeedback(null);

    if (!securityForm.currentPassword || !securityForm.newPassword) {
      setSecurityFeedback("Preencha a senha atual e a nova senha.");
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityFeedback("A confirmação da senha não confere.");
      return;
    }

    updatePassword.mutate();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Configurações"
          title="Perfil, acesso e segurança"
          description="Atualize nome, e-mail, telefone, fuso e sua senha de acesso."
        />

        <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Dados da conta</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">Nome</Label>
                    <Input
                      id="settings-name"
                      value={profileForm.name}
                      onChange={(event) => updateProfileField("name", event.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-email">E-mail</Label>
                    <Input
                      id="settings-email"
                      value={profileForm.email}
                      onChange={(event) => updateProfileField("email", event.target.value)}
                      placeholder="você@contai.app"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-phone">Telefone</Label>
                    <Input
                      id="settings-phone"
                      value={profileForm.phone}
                      onChange={(event) => updateProfileField("phone", event.target.value)}
                      placeholder="(21) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-timezone">Fuso horário</Label>
                    <Input
                      id="settings-timezone"
                      value={profileForm.timezone}
                      onChange={(event) => updateProfileField("timezone", event.target.value)}
                      placeholder="America/Sao_Paulo"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:text-slate-300 sm:px-5">
                  {data?.household ? `Conta: ${data.household.name}` : "Conta não encontrada"} •{" "}
                  {session?.role === "owner" ? "Titular" : "Membro"}
                </div>

                {profileFeedback ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{profileFeedback}</p>
                ) : null}

                <Button type="submit" className="w-full rounded-2xl sm:w-auto" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="settings-current-password">Senha atual</Label>
                    <Input
                      id="settings-current-password"
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(event) => updateSecurityField("currentPassword", event.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-new-password">Nova senha</Label>
                    <Input
                      id="settings-new-password"
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(event) => updateSecurityField("newPassword", event.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-confirm-password">Confirmar nova senha</Label>
                    <Input
                      id="settings-confirm-password"
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(event) => updateSecurityField("confirmPassword", event.target.value)}
                      placeholder="Repita a nova senha"
                    />
                  </div>

                  {securityFeedback ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{securityFeedback}</p>
                  ) : null}

                  <Button type="submit" className="w-full rounded-2xl sm:w-auto" disabled={updatePassword.isPending}>
                    {updatePassword.isPending ? "Atualizando..." : "Atualizar senha"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
              <CardHeader>
                <CardTitle>Informações importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Se você alterar o telefone, esse número passa a ser o identificador do seu WhatsApp no Contai.</p>
                <p>O e-mail e o telefone podem ser usados como login.</p>
                <p>O titular e o segundo membro possuem acessos separados, cada um com a própria senha.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

