"""add_metricas_diarias

Revision ID: t3u4v5w6x7y8
Revises: s2t3u4v5w6x7
Create Date: 2026-04-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 't3u4v5w6x7y8'
down_revision: Union[str, Sequence[str], None] = 's2t3u4v5w6x7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'metricas_diarias',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('empresa_id', sa.Integer(), sa.ForeignKey('empresas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('unidade_id', sa.Integer(), sa.ForeignKey('unidades.id', ondelete='CASCADE'), nullable=True),
        sa.Column('data', sa.Date(), nullable=False),
        sa.Column('total_conversas', sa.Integer(), server_default='0'),
        sa.Column('conversas_encerradas', sa.Integer(), server_default='0'),
        sa.Column('conversas_sem_resposta', sa.Integer(), server_default='0'),
        sa.Column('novos_contatos', sa.Integer(), server_default='0'),
        sa.Column('total_mensagens', sa.Integer(), server_default='0'),
        sa.Column('total_mensagens_ia', sa.Integer(), server_default='0'),
        sa.Column('leads_qualificados', sa.Integer(), server_default='0'),
        sa.Column('taxa_conversao', sa.Float(), server_default='0.0'),
        sa.Column('tempo_medio_resposta', sa.Float(), server_default='0.0'),
        sa.Column('total_solicitacoes_telefone', sa.Integer(), server_default='0'),
        sa.Column('total_links_enviados', sa.Integer(), server_default='0'),
        sa.Column('total_planos_enviados', sa.Integer(), server_default='0'),
        sa.Column('total_matriculas', sa.Integer(), server_default='0'),
        sa.Column('pico_hora', sa.Integer(), nullable=True),
        sa.Column('satisfacao_media', sa.Float(), server_default='0.0'),
        sa.Column('tokens_consumidos', sa.Integer(), nullable=True),
        sa.Column('custo_estimado_usd', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('empresa_id', 'unidade_id', 'data', name='uq_metricas_empresa_unidade_data'),
    )
    op.create_index('ix_metricas_diarias_empresa_data', 'metricas_diarias', ['empresa_id', 'data'])


def downgrade() -> None:
    op.drop_index('ix_metricas_diarias_empresa_data', table_name='metricas_diarias')
    op.drop_table('metricas_diarias')
