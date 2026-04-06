"use client";

import { useMemo, useState } from "react";
import {
  Crop,
  Eraser,
  ImagePlus,
  Layers,
  Sparkles,
  SquareDashedMousePointer,
  WandSparkles,
} from "lucide-react";

type AspectRatio = "9:16" | "1:1" | "4:5";

type Tool = "select" | "mask" | "background" | "transform" | "retouch";

const ratioOptions: Array<{ id: AspectRatio; label: string; description: string }> = [
  { id: "9:16", label: "Story", description: "1080 x 1920" },
  { id: "1:1", label: "Feed Quadrado", description: "1080 x 1080" },
  { id: "4:5", label: "Feed Retrato", description: "1080 x 1350" },
];

const toolOptions: Array<{
  id: Tool;
  label: string;
  hint: string;
  icon: typeof Sparkles;
}> = [
  { id: "select", label: "Selecao", hint: "Move layers e define areas", icon: SquareDashedMousePointer },
  { id: "mask", label: "Mascara IA", hint: "Pinta a regiao para regenerar", icon: Eraser },
  { id: "background", label: "Fundo", hint: "Troca ou expande o fundo", icon: ImagePlus },
  { id: "transform", label: "Formas", hint: "Distorce elementos e mockups", icon: Crop },
  { id: "retouch", label: "Refino", hint: "Ajustes finos orientados por prompt", icon: WandSparkles },
];

const layerStack = [
  { name: "Produto principal", status: "travado" },
  { name: "Mascara ativa", status: "editando" },
  { name: "Background IA v3", status: "gerado" },
];

const ratioClasses: Record<AspectRatio, string> = {
  "9:16": "aspect-[9/16] max-h-[680px]",
  "1:1": "aspect-square max-h-[560px]",
  "4:5": "aspect-[4/5] max-h-[620px]",
};

export function ImageEditor() {
  const [activeRatio, setActiveRatio] = useState<AspectRatio>("9:16");
  const [activeTool, setActiveTool] = useState<Tool>("mask");
  const [prompt, setPrompt] = useState(
    "Troque o fundo por um estudio editorial clean com luz lateral suave e sombra realista.",
  );
  const [brushSize, setBrushSize] = useState(42);
  const [feather, setFeather] = useState(18);

  const currentPreset = useMemo(
    () => ratioOptions.find((option) => option.id === activeRatio) ?? ratioOptions[0],
    [activeRatio],
  );

  return (
    <main className="min-h-screen p-6 text-slate-100 lg:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/40 p-6 backdrop-blur xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              SaaS Canvas + IA
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Instagram AI Studio</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Estrutura inicial para geracao, inpainting, outpainting, ajuste de formas e exportacao otimizada para
                Feed e Stories.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatusCard label="Preset ativo" value={currentPreset.label} />
            <StatusCard label="Ferramenta" value={toolOptions.find((tool) => tool.id === activeTool)?.label ?? "-"} />
            <StatusCard label="Pipeline" value="Pronto para IA" accent />
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur">
            <PanelTitle icon={Layers} title="Formato e Ferramentas" subtitle="Controle de canvas e operacoes." />

            <div className="mt-5 space-y-3">
              {ratioOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActiveRatio(option.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    activeRatio === option.id
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{option.label}</span>
                    <span className="text-xs text-slate-400">{option.id}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {toolOptions.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      activeTool === tool.id
                        ? "border-sky-400/50 bg-sky-400/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="mt-0.5 rounded-xl bg-slate-900/80 p-2 text-slate-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-medium text-white">{tool.label}</span>
                      <span className="mt-1 block text-sm text-slate-400">{tool.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[32px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur">
            <PanelTitle
              icon={Sparkles}
              title="Canvas Interativo"
              subtitle="Preview em tempo real com base para coordenadas de mascara e export."
            />

            <div className="mt-5 rounded-[28px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(7,12,23,0.95))] p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
                <div className="flex min-h-[720px] items-center justify-center rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-6">
                  <div
                    className={`relative w-full max-w-[380px] overflow-hidden rounded-[30px] border border-white/10 shadow-[0_24px_80px_rgba(15,23,42,0.45)] ${ratioClasses[activeRatio]}`}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,197,94,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.35),transparent_40%),url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22rgba(148,163,184,0.16)%22 fill-opacity=%220.2%22%3E%3Cpath d=%22M36 34h-4v-4h4v4zm0-30h-4V0h4v4zM6 34H2v-4h4v4zm0-30H2V0h4v4zm30 60h-4v-4h4v4zM6 64H2v-4h4v4z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-cover bg-center" />
                    <div className="absolute left-[14%] top-[12%] h-[22%] w-[72%] rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-sm" />
                    <div className="absolute inset-x-[10%] bottom-[16%] h-[24%] rounded-[32px] border border-emerald-300/20 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(110,231,183,0.08)]" />
                    <div className="absolute inset-x-[12%] bottom-[24%] rounded-2xl border border-dashed border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                      Area mascarada para inpainting
                    </div>
                    <div className="absolute right-[10%] top-[10%] rounded-full border border-white/15 bg-slate-950/70 px-3 py-1 text-xs tracking-[0.2em] text-slate-300">
                      {activeRatio}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                      <span>Safe area Instagram</span>
                      <span>Export HD</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Camadas</p>
                    <div className="mt-3 space-y-2">
                      {layerStack.map((layer) => (
                        <div
                          key={layer.name}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2"
                        >
                          <span className="text-sm text-slate-200">{layer.name}</span>
                          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">{layer.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Preview tecnico</p>
                    <dl className="mt-3 space-y-3 text-sm text-slate-300">
                      <MetricRow label="Brush" value={`${brushSize}px`} />
                      <MetricRow label="Feather" value={`${feather}%`} />
                      <MetricRow label="Mascara" value="Normalizada" />
                      <MetricRow label="Provider" value="Adapter-ready" />
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur">
            <PanelTitle icon={WandSparkles} title="Prompt e Ajustes" subtitle="Parametros para a chamada de IA." />

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Prompt de geracao</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
                  placeholder="Descreva o fundo, luz, textura e composicao desejada..."
                />
              </label>

              <RangeControl
                label="Tamanho do pincel"
                value={brushSize}
                min={8}
                max={160}
                onChange={setBrushSize}
              />
              <RangeControl label="Feather da mascara" value={feather} min={0} max={100} onChange={setFeather} />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-3 font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                >
                  Gerar Variacao
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Exportar Mock
                </button>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                O backend deve receber a mascara em coordenadas normalizadas do canvas para evitar divergencias entre
                preview, render final e providers de IA.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

type StatusCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function StatusCard({ label, value, accent = false }: StatusCardProps) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

type PanelTitleProps = {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
};

function PanelTitle({ icon: Icon, title, subtitle }: PanelTitleProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-slate-100">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function RangeControl({ label, value, min, max, onChange }: RangeControlProps) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-white">
        {label}
        <span className="text-slate-400">{value}</span>
      </span>
      <input
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-emerald-400"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type MetricRowProps = {
  label: string;
  value: string;
};

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-100">{value}</dd>
    </div>
  );
}
