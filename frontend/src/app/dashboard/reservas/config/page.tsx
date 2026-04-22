"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Save, Loader2, Link2, Info, CheckCircle, AlertCircle } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

type ReservasConfig = {
  link_template?: string;
  currency_id?: string;
  adultos_default?: number;
  criancas_default?: number;
  observacoes?: string;
};

export default function ReservasConfigPage() {
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [cfg, setCfg] = useState<ReservasConfig>({
    link_template: "",
    currency_id: "",
    adultos_default: 1,
    criancas_default: 0,
    observacoes: "",
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const getConfig = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await axios.get("/api-backend/auth/me", getConfig());
        const eid = me.data.empresa_id;
        setEmpresaId(eid);
        if (eid) {
          const res = await axios.get(
            `/api-backend/auth/empresas/${eid}/features/reservas/config`,
            getConfig()
          );
          if (res.data.config) {
            setCfg({
              link_template: res.data.config.link_template || "",
              currency_id: res.data.config.currency_id || "",
              adultos_default: res.data.config.adultos_default ?? 1,
              criancas_default: res.data.config.criancas_default ?? 0,
              observacoes: res.data.config.observacoes || "",
            });
          }
        }
      } catch (err: any) {
        setMsg({ ok: false, text: err.response?.data?.detail || "Erro ao carregar config." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return;
    setSalvando(true);
    setMsg(null);
    try {
      await axios.put(
        `/api-backend/auth/empresas/${empresaId}/features/reservas/config`,
        { config: cfg },
        getConfig()
      );
      setMsg({ ok: true, text: "Configuração salva. A IA já pode gerar links personalizados." });
    } catch (err: any) {
      setMsg({ ok: false, text: err.response?.data?.detail || "Erro ao salvar." });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  const inputCls =
    "w-full bg-[#1A1A1A] border border-white/[0.06] rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20";
  const labelCls = "text-xs text-zinc-400 mb-1.5 block";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <DashboardSidebar activePage="reservas" />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <a
            href="/dashboard/reservas"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            Voltar para Reservas
          </a>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Link de Reserva</h1>
          <p className="text-sm text-zinc-500 mb-6">
            Configure o link do seu motor de reservas. A IA vai personalizar datas e número de hóspedes
            durante a conversa.
          </p>

          {/* Info box */}
          <div className="mb-6 p-4 rounded-xl bg-[#141414] border border-white/[0.06] flex items-start gap-3">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs text-zinc-400 leading-relaxed">
              Cole seu link do Omnibees (ou outro motor). Use variáveis para a IA substituir dinamicamente:
              <div className="mt-2 font-mono text-[11px] text-zinc-300 space-y-0.5">
                <div><span className="text-emerald-300">{"{checkin}"}</span> — data entrada (ddmmyyyy)</div>
                <div><span className="text-emerald-300">{"{checkout}"}</span> — data saída (ddmmyyyy)</div>
                <div><span className="text-emerald-300">{"{adultos}"}</span> — número de adultos</div>
                <div><span className="text-emerald-300">{"{criancas}"}</span> — número de crianças</div>
              </div>
            </div>
          </div>

          <form onSubmit={salvar} className="bg-[#141414] border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <div>
              <label className={labelCls}>Template do link *</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" strokeWidth={1.75} />
                <textarea
                  value={cfg.link_template}
                  onChange={(e) => setCfg({ ...cfg, link_template: e.target.value })}
                  placeholder="https://book.omnibees.com/hotelresults?q=14922&lang=pt-BR&CheckIn={checkin}&CheckOut={checkout}&ad={adultos}&ch={criancas}"
                  className={`${inputCls} pl-10 min-h-[100px] font-mono text-xs leading-relaxed`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Adultos (padrão)</label>
                <input
                  type="number"
                  min={1}
                  value={cfg.adultos_default ?? 1}
                  onChange={(e) => setCfg({ ...cfg, adultos_default: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Crianças (padrão)</label>
                <input
                  type="number"
                  min={0}
                  value={cfg.criancas_default ?? 0}
                  onChange={(e) => setCfg({ ...cfg, criancas_default: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Código de moeda (opcional)</label>
              <input
                type="text"
                value={cfg.currency_id || ""}
                onChange={(e) => setCfg({ ...cfg, currency_id: e.target.value })}
                placeholder="16 (BRL)"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Observações (opcional)</label>
              <textarea
                value={cfg.observacoes || ""}
                onChange={(e) => setCfg({ ...cfg, observacoes: e.target.value })}
                placeholder="Instruções extras para a IA ao enviar o link (ex: mencionar código promocional, política de cancelamento...)"
                className={`${inputCls} min-h-[80px]`}
              />
            </div>

            {msg && (
              <div
                className={`flex items-start gap-2 text-xs p-3 rounded-lg border ${
                  msg.ok
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/5 border-red-500/20 text-red-300"
                }`}
              >
                {msg.ok ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{msg.text}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-100 text-black font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2} />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
