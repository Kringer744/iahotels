"""add_mensagens_feature

Revision ID: x7y8z9a0b1c2
Revises: w6x7y8z9a0b1
Create Date: 2026-04-22

Adiciona a feature "mensagens" (templates de WhatsApp pos-agendamento)
ao catalogo. Habilita por default para empresas com preset barbearia
ou clinica; hotelaria NAO recebe por default porque os sistemas de
reserva (Omnibees etc) raramente expoem API para disparo automatico.
"""
from typing import Sequence, Union
from alembic import op


revision: str = 'x7y8z9a0b1c2'
down_revision: Union[str, Sequence[str], None] = 'w6x7y8z9a0b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) Adiciona ao catalogo
    op.execute("""
        INSERT INTO features (key, nome, descricao, categoria) VALUES
            ('mensagens', 'Mensagens', 'Templates automaticos de WhatsApp (confirmacao, lembretes, avaliacao)', 'comunicacao')
        ON CONFLICT (key) DO NOTHING;
    """)

    # 2) Habilita para todas empresas que JA tem preset de barbearia/clinica
    #    (heuristica: se tem 'agenda' ou 'profissionais' ativo, ganha mensagens).
    #    Hoteis (sem 'agenda' mas com 'reservas') NAO recebem.
    op.execute("""
        INSERT INTO empresa_features (empresa_id, feature_key, ativo)
        SELECT DISTINCT ef.empresa_id, 'mensagens', TRUE
        FROM empresa_features ef
        WHERE ef.ativo = TRUE
          AND ef.feature_key IN ('agenda', 'profissionais')
        ON CONFLICT (empresa_id, feature_key) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("DELETE FROM empresa_features WHERE feature_key = 'mensagens';")
    op.execute("DELETE FROM features WHERE key = 'mensagens';")
