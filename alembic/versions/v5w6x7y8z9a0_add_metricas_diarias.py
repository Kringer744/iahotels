"""add_metricas_diarias

Revision ID: v5w6x7y8z9a0
Revises: u4v5w6x7y8z9
Create Date: 2026-04-13

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'v5w6x7y8z9a0'
down_revision: Union[str, Sequence[str], None] = 'u4v5w6x7y8z9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS metricas_diarias (
            id                          SERIAL PRIMARY KEY,
            empresa_id                  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            unidade_id                  INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
            data                        DATE NOT NULL,
            total_conversas             INTEGER DEFAULT 0,
            conversas_encerradas        INTEGER DEFAULT 0,
            conversas_sem_resposta      INTEGER DEFAULT 0,
            novos_contatos              INTEGER DEFAULT 0,
            total_mensagens             INTEGER DEFAULT 0,
            total_mensagens_ia          INTEGER DEFAULT 0,
            leads_qualificados          INTEGER DEFAULT 0,
            taxa_conversao              FLOAT DEFAULT 0,
            tempo_medio_resposta        FLOAT DEFAULT 0,
            total_solicitacoes_telefone INTEGER DEFAULT 0,
            total_links_enviados        INTEGER DEFAULT 0,
            total_planos_enviados       INTEGER DEFAULT 0,
            total_matriculas            INTEGER DEFAULT 0,
            pico_hora                   INTEGER,
            satisfacao_media            FLOAT,
            tokens_consumidos           INTEGER,
            custo_estimado_usd          FLOAT,
            created_at                  TIMESTAMP DEFAULT NOW(),
            updated_at                  TIMESTAMP DEFAULT NOW(),
            UNIQUE (empresa_id, unidade_id, data)
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_metricas_empresa_data
        ON metricas_diarias (empresa_id, data DESC)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS metricas_diarias")
