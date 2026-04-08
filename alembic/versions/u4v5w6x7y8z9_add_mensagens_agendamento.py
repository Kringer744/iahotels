"""add_mensagens_agendamento

Revision ID: u4v5w6x7y8z9
Revises: t3u4v5w6x7y8
Create Date: 2026-04-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'u4v5w6x7y8z9'
down_revision: Union[str, Sequence[str], None] = 't3u4v5w6x7y8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('personalidade_ia', sa.Column(
        'msg_confirmacao_agendamento', sa.Text, nullable=True,
        server_default=sa.text("'✅ *Agendamento Confirmado!*\n\n📅 {dia}, {data}\n🕐 {horario}\n💈 {barbeiro}\n✂️ {servico}\n\nTe esperamos! Se precisar remarcar ou cancelar, é só me avisar 😊'")
    ))
    op.add_column('personalidade_ia', sa.Column(
        'msg_lembrete_1d', sa.Text, nullable=True,
        server_default=sa.text("'👋 Oi! Lembrando que *amanhã* você tem horário marcado:\n\n📅 {dia}, {data} às {horario}\n💈 Com {barbeiro}\n\nVocê confirma? Responde *sim* ou *não* 😊'")
    ))
    op.add_column('personalidade_ia', sa.Column(
        'msg_lembrete_1h', sa.Text, nullable=True,
        server_default=sa.text("'⏰ Falta *1 hora* pro seu horário:\n\n📅 {dia}, {data} às {horario}\n💈 Com {barbeiro}\n\nVocê confirma? Responde *sim* ou *não* 😊'")
    ))
    op.add_column('personalidade_ia', sa.Column(
        'msg_avaliacao', sa.Text, nullable=True,
        server_default=sa.text("'✂️ Corte finalizado! Como foi seu atendimento com *{barbeiro}*?\n\nDá uma nota de *1 a 5* ⭐\n\n1 ⭐ - Ruim\n2 ⭐⭐ - Regular\n3 ⭐⭐⭐ - Bom\n4 ⭐⭐⭐⭐ - Muito bom\n5 ⭐⭐⭐⭐⭐ - Excelente\n\nSó mandar o número! 😊'")
    ))
    op.add_column('personalidade_ia', sa.Column(
        'msg_avaliacao_obrigado', sa.Text, nullable=True,
        server_default=sa.text("'Obrigado pela avaliação! {estrelas}\n\nSua opinião é muito importante pra gente! 😊'")
    ))


def downgrade() -> None:
    op.drop_column('personalidade_ia', 'msg_avaliacao_obrigado')
    op.drop_column('personalidade_ia', 'msg_avaliacao')
    op.drop_column('personalidade_ia', 'msg_lembrete_1h')
    op.drop_column('personalidade_ia', 'msg_lembrete_1d')
    op.drop_column('personalidade_ia', 'msg_confirmacao_agendamento')
