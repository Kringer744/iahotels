"""
Helper para construir o link de reserva personalizado de hotel.

Usado pela IA em runtime quando o usuario pergunta sobre disponibilidade
ou reserva. Le o template configurado pelo admin em /dashboard/reservas/config
(persistido em empresa_features.config para feature_key='reservas') e
substitui as variaveis {checkin}, {checkout}, {adultos}, {criancas}.

Nota hoteleira: a maioria dos motores de reserva (Omnibees, HBook, etc)
NAO expoem API para consultar disponibilidade em tempo real. O melhor
UX que conseguimos e enviar o link com os parametros ja preenchidos
para o hospede concluir a reserva no site do hotel.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from src.api.deps.features import get_feature_config


async def build_booking_link(
    empresa_id: int,
    checkin: Optional[date] = None,
    checkout: Optional[date] = None,
    adultos: Optional[int] = None,
    criancas: Optional[int] = None,
) -> Optional[str]:
    """Retorna o link de reserva personalizado, ou None se nao configurado."""
    cfg = await get_feature_config(empresa_id, "reservas")
    template = (cfg or {}).get("link_template", "").strip()
    if not template:
        return None

    # Defaults vindos da config (quando usuario nao fornece)
    if adultos is None:
        adultos = int(cfg.get("adultos_default", 1))
    if criancas is None:
        criancas = int(cfg.get("criancas_default", 0))

    # Formato ddmmyyyy e o que Omnibees usa. Outros motores podem esperar
    # yyyy-mm-dd — adicionar variante se/quando surgirem.
    ci = checkin.strftime("%d%m%Y") if checkin else ""
    co = checkout.strftime("%d%m%Y") if checkout else ""

    link = (
        template
        .replace("{checkin}", ci)
        .replace("{checkout}", co)
        .replace("{adultos}", str(adultos))
        .replace("{criancas}", str(criancas))
    )
    return link


async def get_booking_observacoes(empresa_id: int) -> str:
    """Retorna as observacoes configuradas (ex: mencionar codigo promo)."""
    cfg = await get_feature_config(empresa_id, "reservas")
    return (cfg or {}).get("observacoes", "").strip()
