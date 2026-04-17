"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  MessageSquare, Search, ChevronLeft, ChevronRight,
  Building2, Star, Flame, Clock, X, RefreshCw,
  Download, Zap, Bot, BarChart3, Target, Brain, Trash2, TrendingUp, CheckCircle,
  Users, Activity, ArrowUpRight, ChevronRight as ChevRight
} from "lucide-react";

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";

interface Conversation {
  id: number;
  conversation_id: string;
  contato_nome: string;
  contato_fone: string;
  contato_telefone: string;
  score_lead: number;
  lead_qualificado: boolean;
  intencao_de_compra: boolean;
  status: string;
  updated_at: string;
  created_at: string;
  total_mensagens_cliente: number;
  total_mensagens_ia: number;
  resumo_ia: string;
  canal: string;
  unidade_nome: string;
  pausada: boolean;
}

interface EventoFunil {
  tipo_evento: string;
  descricao: string | null;
  score_incremento: number;
  created_at: string;
}

const eventoLabels: Record<string, string> = {
  mudanca_unidade: "Unidade Identificada",
  link_matricula_enviado: "Link de Matrícula Enviado",
  solicitacao_telefone: "Contato Solicitado",
  interesse_detectado: "Interesse Detectado",
  unidade_escolhida: "Unidade Escolhida",
};

const statusColor: Record<string, string> = {
  open: "bg-[#1A1A1A] text-emerald-400 border border-white/[0.06]",
  resolved: "bg-[#1A1A1A] text-zinc-300 border border-white/[0.06]",
  closed: "bg-[#141414] text-zinc-500 border border-white/[0.04]",
  encerrada: "bg-[#141414] text-zinc-500 border border-white/[0.04]",
  pending: "bg-[#1A1A1A] text-zinc-300 border border-white/[0.06]",
};
const statusLabel: Record<string, string> = {
  open: "Ativa", resolved: "Atendido", closed: "Fechada", encerrada: "Encerrada", pending: "Pendente"
};

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [clearingMemory, setClearingMemory] = useState(false);
  const [memoryClearedId, setMemoryClearedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUnidade, setFilterUnidade] = useState<number | "">("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [eventos, setEventos] = useState<EventoFunil[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);

  const getConfig = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      if (filterUnidade) params.append("unidade_id", filterUnidade.toString());
      if (filterStatus) params.append("status", filterStatus);
      if (busca) params.append("busca", busca);
      const res = await axios.get(`/api-backend/dashboard/conversations?${params}`, getConfig());
      setConversations(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [offset, filterUnidade, filterStatus, busca]);

  useEffect(() => {
    axios.get("/api-backend/dashboard/unidades", getConfig()).then(r => setUnidades(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!selected) { setEventos([]); return; }
    setLoadingEventos(true);
    axios.get(`/api-backend/dashboard/conversations/${selected.conversation_id}/eventos`, getConfig())
      .then(r => setEventos(r.data || []))
      .catch(() => setEventos([]))
      .finally(() => setLoadingEventos(false));
  }, [selected?.conversation_id]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setBusca(buscaInput); setOffset(0); };
  const clearFilters = () => { setBusca(""); setBuscaInput(""); setFilterStatus(""); setFilterUnidade(""); setOffset(0); };

  const exportLeads = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterUnidade) params.append("unidade_id", filterUnidade.toString());
      if (filterStatus) params.append("status", filterStatus);
      const res = await axios.get(`/api-backend/management/export-leads?${params}`, getConfig());
      const allLeads = res.data || [];
      const headers = ["Nome", "Telefone", "Score", "Qualificado", "Intencao", "Status", "Unidade", "Msgs Cliente", "IA", "Data"];
      const rows = allLeads.map((c: any) => [
        c.contato_nome || "Anônimo", c.contato_fone || c.contato_telefone || "",
        c.score_lead || 0, c.lead_qualificado ? "Sim" : "Não", c.intencao_de_compra ? "Sim" : "Não",
        c.status, c.unidade_nome || "", c.total_mensagens_cliente || 0, c.total_mensagens_ia || 0,
        c.created_at ? new Date(c.created_at).toLocaleString() : ""
      ]);
      const csv = [headers, ...rows].map(e => e.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { console.error(err); }
    finally { setExporting(false); }
  };
  
  const handleGenerateSummary = async () => {
    if (!selected) return;
    setSummarizing(true);
    try {
      const res = await axios.post(`/api-backend/dashboard/conversations/${selected.conversation_id}/resumo`, {}, getConfig());
      if (res.data.status === "success") {
        const newSummary = res.data.resumo_ia;
        setSelected({ ...selected, resumo_ia: newSummary });
        setConversations(conversations.map(c => c.conversation_id === selected.conversation_id ? { ...c, resumo_ia: newSummary } : c));
      }
    } catch (err) {
      console.error("Erro ao gerar resumo:", err);
    } finally {
      setSummarizing(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <DashboardSidebar activePage="conversas" />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-[17px] font-medium text-white tracking-tight leading-tight">
                Central de Inteligência
              </h1>
              <p className="text-xs text-zinc-500 tracking-tight mt-0.5">
                <span className="text-zinc-300 tabular-nums">{total}</span> conversas mapeadas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportLeads}
              disabled={exporting}
              className="hidden sm:flex items-center gap-2 bg-[#141414] hover:bg-[#1A1A1A] border border-white/[0.06] hover:border-white/[0.12] px-3.5 py-2 rounded-xl text-sm text-zinc-300 hover:text-white tracking-tight transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              {exporting ? "Exportando..." : "Exportar leads"}
            </button>
            <button
              onClick={() => fetchConversations()}
              className="p-2 bg-[#141414] hover:bg-[#1A1A1A] rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* ═════════════ LIST PANEL ═════════════
              Full-width CRM table when nothing selected.
              Shrinks to 360px compact list when a conversation is open.
          ═══════════════════════════════════════ */}
          <div className={`flex flex-col bg-[#0A0A0A] ${selected ? "hidden lg:flex lg:w-[360px] border-r border-white/[0.06]" : "w-full"}`}>

            {/* ── Stats strip (only visible when full width) ── */}
            {!selected && (
              <div className="px-6 lg:px-8 pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const ativas = conversations.filter(c => c.status === "open").length;
                    const pausadas = conversations.filter(c => c.pausada).length;
                    const quentes = conversations.filter(c => c.intencao_de_compra).length;
                    const stats = [
                      { label: "Total", value: total, icon: Users },
                      { label: "Ativas", value: ativas, icon: Activity, dot: "bg-emerald-400" },
                      { label: "IA pausada", value: pausadas, icon: Bot, dot: "bg-zinc-400" },
                      { label: "Leads quentes", value: quentes, icon: Flame, dot: "bg-white" },
                    ];
                    return stats.map(s => (
                      <div key={s.label} className="bg-[#141414] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
                            <p className="text-xs text-zinc-400 tracking-tight">{s.label}</p>
                          </div>
                          <p className="text-[28px] font-normal text-white tracking-[-0.02em] tabular-nums leading-none">
                            {loading ? <span className="inline-block w-8 h-6 bg-white/[0.06] rounded animate-pulse" /> : s.value}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                          <s.icon className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* ── Filters row ── */}
            <div className={`${!selected ? "px-6 lg:px-8 pt-6" : "p-4"} ${!selected ? "pb-4" : ""}`}>
              <div className={`${!selected ? "flex flex-col md:flex-row gap-2" : "space-y-2.5"}`}>
                <form onSubmit={handleSearch} className={`relative ${!selected ? "flex-1" : ""}`}>
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.75} />
                  <input
                    value={buscaInput}
                    onChange={e => setBuscaInput(e.target.value)}
                    placeholder="Buscar por nome ou telefone"
                    className="w-full bg-[#141414] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-colors tracking-tight"
                  />
                </form>
                <div className={`flex gap-2 ${!selected ? "flex-shrink-0" : ""}`}>
                  <select
                    value={filterUnidade}
                    onChange={e => { setFilterUnidade(e.target.value ? Number(e.target.value) : ""); setOffset(0); }}
                    className={`bg-[#141414] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-white/20 cursor-pointer tracking-tight transition-colors ${!selected ? "min-w-[160px]" : "flex-1 text-xs py-2"}`}
                  >
                    <option value="">Todas as unidades</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setOffset(0); }}
                    className={`bg-[#141414] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-white/20 cursor-pointer tracking-tight transition-colors ${!selected ? "min-w-[140px]" : "flex-1 text-xs py-2"}`}
                  >
                    <option value="">Todos os status</option>
                    <option value="open">Ativas</option>
                    <option value="resolved">Atendidas</option>
                    <option value="closed">Fechadas</option>
                  </select>
                  {(busca || filterStatus || filterUnidade) && (
                    <button
                      onClick={clearFilters}
                      title="Limpar filtros"
                      className="bg-[#141414] text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-2.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Content: table (full) OR list (compact) ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="px-6 lg:px-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-4 border-b border-white/[0.04] animate-pulse">
                      <div className="w-9 h-9 bg-white/[0.05] rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/[0.05] rounded w-1/3" />
                        <div className="h-2 bg-white/[0.05] rounded w-1/5" />
                      </div>
                      <div className="w-20 h-5 bg-white/[0.05] rounded" />
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-12 h-12 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-center mb-4">
                    <MessageSquare className="w-5 h-5 text-zinc-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-zinc-400 tracking-tight mb-1">Nenhum resultado</p>
                  <p className="text-xs text-zinc-600 tracking-tight">Ajuste os filtros ou aguarde novas conversas</p>
                </div>
              ) : !selected ? (
                /* ═════════ CRM TABLE (full width) ═════════ */
                <div className="px-6 lg:px-8 pb-6">
                  <div className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_32px] gap-4 px-5 py-3 border-b border-white/[0.06] bg-[#141414]">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Lead</span>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Telefone</span>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Score</span>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Status</span>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Unidade</span>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Atividade</span>
                      <span />
                    </div>
                    {/* Table rows */}
                    {conversations.map((conv, i) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelected(conv)}
                        className={`w-full grid grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_32px] gap-4 px-5 py-3.5 text-left hover:bg-white/[0.025] transition-colors items-center ${i !== conversations.length - 1 ? "border-b border-white/[0.04]" : ""} group`}
                      >
                        {/* Lead */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-white/[0.06] group-hover:border-white/[0.12] transition-colors flex items-center justify-center text-sm font-medium text-zinc-200 flex-shrink-0">
                            {conv.contato_nome?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate tracking-tight">
                              {conv.contato_nome || "Anônimo"}
                            </p>
                            {conv.pausada || conv.intencao_de_compra ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                {conv.pausada && (
                                  <span className="text-[10px] text-zinc-500 tracking-tight flex items-center gap-0.5">
                                    <Bot className="w-2.5 h-2.5" strokeWidth={1.75} /> pausada
                                  </span>
                                )}
                                {conv.intencao_de_compra && (
                                  <span className="text-[10px] text-zinc-300 tracking-tight flex items-center gap-0.5">
                                    <Flame className="w-2.5 h-2.5" strokeWidth={1.75} /> quente
                                  </span>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Telefone */}
                        <span className="text-sm text-zinc-400 tracking-tight tabular-nums truncate">
                          {conv.contato_fone || conv.contato_telefone || "—"}
                        </span>

                        {/* Score */}
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <div
                              key={s}
                              className={`w-1.5 h-1.5 rounded-full ${s <= (conv.score_lead || 0) ? "bg-white" : "bg-white/10"}`}
                            />
                          ))}
                        </div>

                        {/* Status */}
                        <div>
                          <span className={`text-[11px] px-2 py-0.5 rounded-md tracking-tight font-medium inline-block ${statusColor[conv.status] || "bg-[#141414] text-zinc-500 border border-white/[0.04]"}`}>
                            {statusLabel[conv.status] || conv.status}
                          </span>
                        </div>

                        {/* Unidade */}
                        <span className="text-sm text-zinc-400 tracking-tight truncate">
                          {conv.unidade_nome || "—"}
                        </span>

                        {/* Atividade */}
                        <span className="text-sm text-zinc-500 tracking-tight tabular-nums">
                          {timeAgo(conv.updated_at || conv.created_at)}
                        </span>

                        {/* Chevron */}
                        <ChevRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" strokeWidth={1.75} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ═════════ COMPACT LIST (when detail open) ═════════ */
                <div className="p-2 space-y-1">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelected(conv)}
                      className={`w-full text-left px-3 py-3 rounded-xl transition-colors relative group border ${
                        selected?.id === conv.id
                          ? "bg-[#1A1A1A] border-white/[0.08]"
                          : "hover:bg-white/[0.03] border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium flex-shrink-0 transition-colors ${
                          selected?.id === conv.id
                            ? "bg-[#232323] border border-white/[0.1] text-white"
                            : "bg-[#141414] border border-white/[0.06] text-zinc-300 group-hover:border-white/[0.1]"
                        }`}>
                          {conv.contato_nome?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-white truncate tracking-tight">
                              {conv.contato_nome || "Anônimo"}
                            </p>
                            <span className="text-[10px] text-zinc-500 tabular-nums tracking-tight flex-shrink-0">
                              {timeAgo(conv.updated_at || conv.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 tracking-tight mb-2 tabular-nums truncate">
                            {conv.contato_fone || conv.contato_telefone || "—"}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <div
                                  key={s}
                                  className={`w-1 h-1 rounded-full ${s <= (conv.score_lead || 0) ? "bg-white" : "bg-white/10"}`}
                                />
                              ))}
                            </div>
                            {conv.pausada && (
                              <span className="text-[10px] text-zinc-400 flex items-center gap-1 bg-[#141414] px-1.5 py-0.5 rounded-md border border-white/[0.06] tracking-tight">
                                <Bot className="w-2.5 h-2.5" strokeWidth={1.75} /> pausada
                              </span>
                            )}
                            {conv.intencao_de_compra && (
                              <span className="text-[10px] text-white flex items-center gap-1 bg-[#232323] px-1.5 py-0.5 rounded-md border border-white/[0.08] tracking-tight">
                                <Flame className="w-2.5 h-2.5" strokeWidth={1.75} /> quente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className={`${!selected ? "px-6 lg:px-8 py-4" : "p-3"} border-t border-white/[0.06] flex items-center justify-between`}>
                <span className="text-xs text-zinc-500 tracking-tight tabular-nums">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="p-2 bg-[#141414] rounded-lg border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={currentPage >= totalPages}
                    className="p-2 bg-[#141414] rounded-lg border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selected ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A]/40 border-l border-white/5">
                <div className="p-8 border-b border-white/5">
                  <div className="flex items-center justify-between mb-6 lg:hidden">
                    <button onClick={() => setSelected(null)} className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-[#FFFFFF]/10 transition-all">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-[#FFFFFF]/20 border-2 border-[#FFFFFF]/20 flex items-center justify-center text-4xl font-black text-[#FFFFFF] relative flex-shrink-0">
                      {selected.contato_nome?.charAt(0) || "?"}
                      <div className="absolute -bottom-2 -right-2 p-2.5 bg-[#FFFFFF] text-black rounded-xl shadow-lg">
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h2 className="text-2xl font-black truncate">{selected.contato_nome || "Anônimo"}</h2>
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${statusColor[selected.status] || "bg-slate-700/20 text-slate-500"}`}>
                          {statusLabel[selected.status] || selected.status}
                        </span>
                      </div>
                      <p className="text-slate-500 font-bold flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-[#FFFFFF]/40" />
                        {selected.contato_fone || selected.contato_telefone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <button 
                        onClick={async () => {
                          try {
                            const res = await axios.post(`/api-backend/dashboard/conversations/${selected.conversation_id}/toggle-ia`, {}, getConfig());
                            const newStatus = res.data.pausada;
                            setSelected({ ...selected, pausada: newStatus });
                            setConversations(conversations.map(c => c.conversation_id === selected.conversation_id ? { ...c, pausada: newStatus } : c));
                          } catch (err) { console.error(err); }
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          selected.pausada 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                            : "bg-[#1A1A1A] text-zinc-300 border-white/[0.08] hover:bg-[#232323]"
                        }`}
                      >
                        {selected.pausada ? (
                          <><Zap className="w-4 h-4" /> Ativar IA</>
                        ) : (
                          <><X className="w-4 h-4" /> Pausar IA</>
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Limpar toda a memória da IA nessa conversa? A IA vai esquecer o histórico.")) return;
                          setClearingMemory(true);
                          try {
                            await axios.post(`/api-backend/dashboard/conversations/${selected.conversation_id}/limpar-memoria`, {}, getConfig());
                            setSelected({ ...selected, total_mensagens_cliente: 0, total_mensagens_ia: 0 });
                            setConversations(conversations.map(c => c.conversation_id === selected.conversation_id ? { ...c, total_mensagens_cliente: 0, total_mensagens_ia: 0 } : c));
                            setMemoryClearedId(String(selected.conversation_id));
                            setTimeout(() => setMemoryClearedId(null), 3000);
                          } catch (err: any) {
                            console.error(err);
                            alert(err?.response?.data?.detail || "Erro ao limpar memória. Tente novamente.");
                          }
                          finally { setClearingMemory(false); }
                        }}
                        disabled={clearingMemory}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {clearingMemory ? "Limpando..." : "Limpar Memória"}
                      </button>
                      {memoryClearedId === String(selected.conversation_id) && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/15">
                          MEMÓRIA LIMPA ✓
                        </span>
                      )}
                      {selected.pausada && (
                        <span className="text-[10px] font-black text-zinc-300 bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/[0.08] animate-pulse">
                          AUTOMAÇÃO DESATIVADA
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Lead Score — dots visuais */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-[#FFFFFF]/15 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-[#FFFFFF]/50" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Score</span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {[1, 2, 3, 4, 5].map(s => (
                          <div key={s} className={`w-3 h-3 rounded-full transition-all ${
                            s <= (selected.score_lead || 0)
                              ? "bg-[#FFFFFF] shadow-[0_0_6px_rgba(212,175,55,0.6)]"
                              : "bg-white/10"
                          }`} />
                        ))}
                        <span className="text-xs font-black text-slate-400 ml-1">{selected.score_lead || 0}/5</span>
                      </div>
                    </div>

                    {/* Intenção — ALTA / MÉDIA / BAIXA */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-[#FFFFFF]/15 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-[#FFFFFF]/50" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intenção</span>
                      </div>
                      <p className="text-xl font-black">
                        {selected.intencao_de_compra ? "ALTA 🔥" : (selected.score_lead || 0) > 0 ? "MÉDIA" : "BAIXA"}
                      </p>
                    </div>

                    {/* Mensagens */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-[#FFFFFF]/15 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-[#FFFFFF]/50" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mensagens</span>
                      </div>
                      <p className="text-xl font-black">
                        {(selected.total_mensagens_cliente || 0) + (selected.total_mensagens_ia || 0)}
                      </p>
                    </div>

                    {/* Fase Funil — mapeamento completo */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-[#FFFFFF]/15 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-[#FFFFFF]/50" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fase Funil</span>
                      </div>
                      <p className="text-xl font-black">
                        {selected.status === "open" ? "NEGOCIAÇÃO"
                          : selected.status === "resolved" ? "CONVERTIDO"
                          : selected.status === "pending" ? "PENDENTE"
                          : "FINALIZADO"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-7 hover:border-[#FFFFFF]/15 transition-all">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-[#FFFFFF]" />
                        <h3 className="text-lg font-black uppercase tracking-widest">Resumo Neural</h3>
                      </div>
                      <button 
                        onClick={handleGenerateSummary}
                        disabled={summarizing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/20 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all disabled:opacity-50"
                      >
                        {summarizing ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" /> Gerando...</>
                        ) : (
                          <><Zap className="w-3 h-3" /> Gerar Resumo</>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-400 leading-relaxed italic">
                      "{selected.resumo_ia || "Nenhuma análise disponível para este lead."}"
                    </p>
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-7 space-y-4 hover:border-[#FFFFFF]/15 transition-all">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Informações de Tráfego</h4>
                    {[
                      { label: "Unidade de Origem", value: selected.unidade_nome || "—", icon: Building2 },
                      { label: "Canal de Entrada", value: selected.canal || "—", icon: Zap },
                      { label: "Registrado em", value: selected.created_at ? new Date(selected.created_at).toLocaleString("pt-BR") : "—", icon: Clock },
                      { label: "Última Atividade", value: selected.updated_at ? new Date(selected.updated_at).toLocaleString("pt-BR") : "—", icon: Clock },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 last:pb-0">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-2.5">
                          <row.icon className="w-4 h-4 text-[#FFFFFF]/40" /> {row.label}
                        </span>
                        <span className="text-sm font-black">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-bold text-slate-500 flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[#FFFFFF]/40" /> Lead Qualificado
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        selected.lead_qualificado
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-700/20 text-slate-500 border border-slate-700/20"
                      }`}>
                        {selected.lead_qualificado ? "Sim" : "Não"}
                      </span>
                    </div>
                  </div>
                  {/* Histórico de Pontuação */}
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-7 hover:border-[#FFFFFF]/15 transition-all">
                    <div className="flex items-center gap-3 mb-5">
                      <TrendingUp className="w-5 h-5 text-[#FFFFFF]" />
                      <h3 className="text-lg font-black uppercase tracking-widest">Histórico de Pontuação</h3>
                    </div>

                    {loadingEventos ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-4 animate-pulse">
                            <div className="w-8 h-8 bg-white/5 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-2.5 bg-white/5 rounded w-1/3" />
                              <div className="h-2 bg-white/5 rounded w-2/3" />
                            </div>
                            <div className="w-12 h-5 bg-white/5 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : eventos.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">Nenhum evento de pontuação registrado ainda.</p>
                    ) : (
                      <div className="space-y-1">
                        {eventos.map((ev, idx) => (
                          <div key={idx} className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="w-8 h-8 rounded-xl bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Star className="w-3.5 h-3.5 text-[#FFFFFF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black">{eventoLabels[ev.tipo_evento] ?? ev.tipo_evento}</p>
                              {ev.descricao && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.descricao}</p>
                              )}
                              <p className="text-[10px] text-slate-600 mt-1">
                                {new Date(ev.created_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex-shrink-0 self-start">
                              +{ev.score_incremento} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 hidden lg:flex flex-col items-center justify-center gap-5 px-8">
                <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-zinc-500" strokeWidth={1.5} />
                </div>
                <div className="text-center max-w-sm">
                  <p className="text-[17px] font-medium text-white tracking-tight mb-1.5">
                    Selecione uma conversa
                  </p>
                  <p className="text-sm text-zinc-500 tracking-tight leading-relaxed">
                    Escolha um lead à esquerda para ver o resumo neural, funil de eventos e métricas de qualificação.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
