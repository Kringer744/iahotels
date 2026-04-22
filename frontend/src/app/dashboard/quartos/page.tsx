"use client";
export const dynamic = "force-dynamic";

import { BedDouble, Info } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function QuartosPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <DashboardSidebar activePage="quartos" />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-1 flex items-center gap-2">
              <BedDouble className="w-6 h-6 text-zinc-400" strokeWidth={1.75} />
              Quartos
            </h1>
            <p className="text-sm text-zinc-500">
              Cadastre categorias de quartos, preços e descrições usadas pela IA.
            </p>
          </div>

          <div className="p-10 rounded-2xl bg-[#141414] border border-white/[0.06] text-center">
            <Info className="w-5 h-5 text-zinc-500 mx-auto mb-3" strokeWidth={1.75} />
            <p className="text-sm text-zinc-400 mb-1">Cadastro de quartos em breve.</p>
            <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
              Por enquanto, descreva as categorias, preços e diferenciais dos quartos em
              <a href="/dashboard/personality" className="text-white hover:underline mx-1">Personalidade IA</a>
              ou no conhecimento (FAQ) para a IA responder corretamente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
