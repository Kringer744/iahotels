"use client";
export const dynamic = "force-dynamic";

import { CalendarCheck, Settings, ArrowRight, Info } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function ReservasPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <DashboardSidebar activePage="reservas" />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-1 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-zinc-400" strokeWidth={1.75} />
                Reservas
              </h1>
              <p className="text-sm text-zinc-500">
                Configure o motor de reservas e acompanhe os pedidos recebidos.
              </p>
            </div>
          </div>

          {/* Config card */}
          <a
            href="/dashboard/reservas/config"
            className="block mb-6 p-5 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-white/10 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white tracking-tight">Link de reserva</p>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" strokeWidth={1.75} />
                </div>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Configure o template do seu motor (Omnibees, HBook, etc). A IA vai personalizar datas
                  e hóspedes durante a conversa e enviar o link pronto pro hóspede.
                </p>
              </div>
            </div>
          </a>

          {/* Empty list placeholder */}
          <div className="p-8 rounded-2xl bg-[#141414] border border-white/[0.06] text-center">
            <Info className="w-5 h-5 text-zinc-500 mx-auto mb-2" strokeWidth={1.75} />
            <p className="text-sm text-zinc-400">Listagem de reservas em breve.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Por enquanto, a IA já pode enviar links personalizados assim que você configurar o template.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
