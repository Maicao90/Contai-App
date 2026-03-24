import { useState, useEffect, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

let memoryState: Toast[] = [];
let listeners: React.Dispatch<React.SetStateAction<Toast[]>>[] = [];

export function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { ...props, id };
  memoryState = [...memoryState, newToast];
  listeners.forEach((listener) => listener(memoryState));

  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(memoryState));
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return { toasts, toast };
}
