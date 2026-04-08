"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MessageSquare, Save, Loader2, CheckCircle2, Eye, EyeOff,
  CalendarCheck, Bell, Clock, Star, ThumbsUp
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const textareaClass =
  "w-full bg-slate-900/60 border border-white/8 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]/40 focus:bg-slate-900/80 transition-all font-medium text-sm resize-none leading-relaxed";

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#D4AF37]/50" />} {label}
      </label>
      {children}
    </div>
  );
}

// ─── Sample data for previews ───────────────────────────────────────────────
const SAMPLE_DATA: Record<string, string> = {
  dia: "Sexta-feira",
  data: "11/04/2026",
  horario: "14:30",
  barbeiro: "Carlos",
  servico: "Corte + Barba",
  estrelas: "\u2b50\u2b50\u2b50\u2b50\u2b50",
};

// ─── Message field config ───────────────────────────────────────────────────
interface MsgField {
  key: string;
  label: string;
  icon: any;
  description: string;
  variables: string[];
  rows: number;
  defaultValue: string;
}

const MSG_FIELDS: MsgField[] = [
  {
    key: "msg_confirmacao_agendamento",
    label: "Confirmacao de Agendamento",
    icon: CalendarCheck,
    description: "Enviada ao cliente quando um agendamento e confirmado.",
    variables: ["dia", "data", "horario", "barbeiro", "servico"],
    rows: 6,
    defaultValue:
      "\u2705 *Agendamento Confirmado!*\n\n\ud83d\udcc5 {dia}, {data}\n\ud83d\udd50 {horario}\n\ud83d\udc88 {barbeiro}\n\u2702\ufe0f {servico}\n\nTe esperamos! Se precisar remarcar ou cancelar, e so me avisar \ud83d\ude0a",
  },
  {
    key: "msg_lembrete_1d",
    label: "Lembrete - 1 Dia Antes",
    icon: Bell,
    description: "Enviada 24 horas antes do horario marcado.",
    variables: ["dia", "data", "horario", "barbeiro"],
    rows: 5,
    defaultValue:
      "\ud83d\udc4b Oi! Lembrando que *amanha* voce tem horario marcado:\n\n\ud83d\udcc5 {dia}, {data} as {horario}\n\ud83d\udc88 Com {barbeiro}\n\nVoce confirma? Responde *sim* ou *nao* \ud83d\ude0a",
  },
  {
    key: "msg_lembrete_1h",
    label: "Lembrete - 1 Hora Antes",
    icon: Clock,
    description: "Enviada 1 hora antes do horario marcado.",
    variables: ["dia", "data", "horario", "barbeiro"],
    rows: 5,
    defaultValue:
      "\u23f0 Falta *1 hora* pro seu horario:\n\n\ud83d\udcc5 {dia}, {data} as {horario}\n\ud83d\udc88 Com {barbeiro}\n\nVoce confirma? Responde *sim* ou *nao* \ud83d\ude0a",
  },
  {
    key: "msg_avaliacao",
    label: "Pedido de Avaliacao",
    icon: Star,
    description: "Enviada apos a conclusao do servico para pedir avaliacao.",
    variables: ["barbeiro"],
    rows: 8,
    defaultValue:
      "\u2702\ufe0f Corte finalizado! Como foi seu atendimento com *{barbeiro}*?\n\nDa uma nota de *1 a 5* \u2b50\n\n1 \u2b50 - Ruim\n2 \u2b50\u2b50 - Regular\n3 \u2b50\u2b50\u2b50 - Bom\n4 \u2b50\u2b50\u2b50\u2b50 - Muito bom\n5 \u2b50\u2b50\u2b50\u2b50\u2b50 - Excelente\n\nSo mandar o numero! \ud83d\ude0a",
  },
  {
    key: "msg_avaliacao_obrigado",
    label: "Agradecimento de Avaliacao",
    icon: ThumbsUp,
    description: "Enviada apos o cliente enviar a nota de avaliacao.",
    variables: ["estrelas"],
    rows: 3,
    defaultValue:
      "Obrigado pela avaliacao! {estrelas}\n\nSua opiniao e muito importante pra gente! \ud83d\ude0a",
  },
];

// ─── Preview renderer ───────────────────────────────────────────────────────
function renderPreview(template: string): string {
  let result = template;
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MensagensPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [personalityId, setPersonalityId] = useState<number | null>(null);

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api-backend/management/personalities", getConfig());
      const personalities = res.data;
      if (personalities && personalities.length > 0) {
        const p = personalities[0];
        setPersonalityId(p.id);
        const data: Record<string, string> = {};
        for (const field of MSG_FIELDS) {
          data[field.key] = p[field.key] || field.defaultValue;
        }
        setFormData(data);
      } else {
        // No personality yet, use defaults
        const data: Record<string, string> = {};
        for (const field of MSG_FIELDS) {
          data[field.key] = field.defaultValue;
        }
        setFormData(data);
      }
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
      const data: Record<string, string> = {};
      for (const field of MSG_FIELDS) {
        data[field.key] = field.defaultValue;
      }
      setFormData(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      if (personalityId) {
        await axios.put(
          `/api-backend/management/personalities/${personalityId}`,
          formData,
          getConfig()
        );
      } else {
        await axios.post("/api-backend/management/personality", formData, getConfig());
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      console.error("Erro ao salvar:", e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Erro desconhecido";
      alert(`Erro ao salvar mensagens: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const togglePreview = (key: string) => {
    setPreviews((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetField = (key: string) => {
    const field = MSG_FIELDS.find((f) => f.key === key);
    if (field) {
      setFormData((prev) => ({ ...prev, [key]: field.defaultValue }));
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090f] text-white flex">
      <DashboardSidebar activePage="mensagens" />

      <main className="flex-1 min-w-0 overflow-auto">
        {/* Decorative glow */}
        <div className="fixed top-0 right-0 w-[600px] h-[400px] bg-[#D4AF37]/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 p-8 lg:p-10 max-w-4xl mx-auto">
          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-5 bg-[#D4AF37] rounded-full" />
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">
                  Barber IA
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                <span
                  style={{
                    background: "linear-gradient(135deg, #fff 0%, #D4AF37 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Mensagens
                </span>
              </h1>
              <p className="text-slate-500 mt-2 font-medium italic text-sm max-w-lg">
                Configure as mensagens de agendamento, lembretes e avaliacao enviadas automaticamente.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving || loading}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm min-w-[200px] justify-center transition-all ${
                success
                  ? "bg-emerald-500 text-white"
                  : "bg-[#D4AF37] text-black shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
              }`}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar
                </>
              )}
            </motion.button>
          </div>

          {/* ── Loading state ────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            </div>
          ) : (
            /* ── Message fields ──────────────────────────────────────── */
            <div className="space-y-8">
              {MSG_FIELDS.map((field, i) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-[#D4AF37]/20 transition-all"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center">
                        <field.icon className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">
                          {field.label}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetField(field.key)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-wider"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePreview(field.key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/30 rounded-lg text-[10px] font-bold text-slate-400 hover:text-[#D4AF37] transition-all uppercase tracking-wider"
                      >
                        {previews[field.key] ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Editar
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Preview
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Variables badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mr-1 self-center">
                      Variaveis:
                    </span>
                    {field.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[10px] font-bold text-[#D4AF37] cursor-pointer hover:bg-[#D4AF37]/20 transition-all"
                        onClick={() => {
                          const textarea = document.getElementById(
                            `textarea-${field.key}`
                          ) as HTMLTextAreaElement | null;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const current = formData[field.key] || "";
                            const newVal =
                              current.substring(0, start) +
                              `{${v}}` +
                              current.substring(end);
                            setFormData((prev) => ({ ...prev, [field.key]: newVal }));
                          }
                        }}
                      >
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>

                  {/* Textarea or Preview */}
                  {previews[field.key] ? (
                    <div className="bg-slate-900/60 border border-white/8 rounded-2xl px-5 py-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {renderPreview(formData[field.key] || field.defaultValue)}
                    </div>
                  ) : (
                    <textarea
                      id={`textarea-${field.key}`}
                      className={textareaClass}
                      rows={field.rows}
                      value={formData[field.key] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
