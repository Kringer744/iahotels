"""add_features

Revision ID: w6x7y8z9a0b1
Revises: v5w6x7y8z9a0
Create Date: 2026-04-22

Introduz camada de features para suportar arquitetura multi-nicho.
- Cria catalogo global `features` com as capacidades do sistema.
- Cria tabela de juncao `empresa_features` (empresa_id, feature_key, ativo, config).
- Habilita por default o preset "barbearia" para todas empresas existentes,
  garantindo backward compatibility total.
"""
from typing import Sequence, Union
from alembic import op


revision: str = 'w6x7y8z9a0b1'
down_revision: Union[str, Sequence[str], None] = 'v5w6x7y8z9a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) Catalogo global de features disponiveis no sistema
    op.execute("""
        CREATE TABLE IF NOT EXISTS features (
            key          VARCHAR(64) PRIMARY KEY,
            nome         VARCHAR(128) NOT NULL,
            descricao    TEXT,
            categoria    VARCHAR(32) NOT NULL DEFAULT 'geral',
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # 2) Relacao empresa <-> feature (com config por empresa)
    op.execute("""
        CREATE TABLE IF NOT EXISTS empresa_features (
            empresa_id   INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            feature_key  VARCHAR(64) NOT NULL REFERENCES features(key) ON DELETE CASCADE,
            ativo        BOOLEAN NOT NULL DEFAULT TRUE,
            config       JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (empresa_id, feature_key)
        );
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_empresa_features_empresa_ativo
        ON empresa_features(empresa_id) WHERE ativo = TRUE;
    """)

    # 3) Seed do catalogo de features conhecidas
    op.execute("""
        INSERT INTO features (key, nome, descricao, categoria) VALUES
            ('agenda',        'Agenda',         'Agendamentos e horarios',                 'operacao'),
            ('profissionais', 'Profissionais',  'Cadastro de profissionais/barbeiros',     'operacao'),
            ('servicos',      'Servicos',       'Catalogo de servicos oferecidos',         'operacao'),
            ('avaliacoes',    'Avaliacoes',     'Avaliacoes pos-atendimento',              'operacao'),
            ('clientes',      'Clientes',       'Base de clientes/contatos',               'crm'),
            ('reservas',      'Reservas',       'Reservas (hotelaria)',                    'operacao'),
            ('quartos',       'Quartos',        'Inventario de quartos/acomodacoes',       'operacao'),
            ('hospedes',      'Hospedes',       'Cadastro de hospedes',                    'crm'),
            ('checkin',       'Check-in',       'Fluxo de check-in / check-out',           'operacao')
        ON CONFLICT (key) DO NOTHING;
    """)

    # 4) Backward compatibility: habilita preset "barbearia" para TODAS empresas
    #    existentes. Sem isso, empresas atuais perderiam acesso as telas.
    op.execute("""
        INSERT INTO empresa_features (empresa_id, feature_key, ativo)
        SELECT e.id, f.key, TRUE
        FROM empresas e
        CROSS JOIN features f
        WHERE f.key IN ('agenda','profissionais','servicos','avaliacoes','clientes')
        ON CONFLICT (empresa_id, feature_key) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS empresa_features;")
    op.execute("DROP TABLE IF EXISTS features;")
