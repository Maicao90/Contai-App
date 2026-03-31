export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(`/api${url}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let message = `Erro ao carregar ${url}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`/api${url}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Erro ao enviar ${url}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function patchJson<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`/api${url}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Erro ao atualizar ${url}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${url}`, {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    let message = `Erro ao carregar ${url}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
