"""Add operational event stream columns to event_logs.

Revision ID: 8f1a2b3c4d5e
Revises: 7cbd04eb1003
Create Date: 2026-09-07 15:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '8f1a2b3c4d5e'
down_revision: Union[str, Sequence[str], None] = '7cbd04eb1003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    tables = insp.get_table_names()
    if 'event_logs' not in tables:
        op.create_table(
            'event_logs',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, primary_key=True),
            sa.Column('station_id', sa.String(64), sa.ForeignKey('stations.id'), nullable=False, index=True),
            sa.Column('event_type', sa.String(64), server_default='TELEMETRY_CHANGE', nullable=False, index=True),
            sa.Column('category', sa.String(64), server_default='OPERATIONAL', nullable=False, index=True),
            sa.Column('severity', sa.String(16), server_default='INFO', nullable=False),
            sa.Column('entity_type', sa.String(64), nullable=True, index=True),
            sa.Column('entity_id', sa.String(64), nullable=True, index=True),
            sa.Column('title', sa.String(256), nullable=True),
            sa.Column('summary', sa.String(512), nullable=True),
            sa.Column('message', sa.String(512), nullable=False, server_default=''),
            sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, index=True),
            sa.Column('source', sa.String(128), server_default='SYNTHETIC_SIMULATION', nullable=False),
            sa.Column('truth_type', sa.String(32), server_default='MEASURED', nullable=False),
            sa.Column('metadata_json', sa.Text(), nullable=True),
        )
    else:
        existing_cols = {c['name'] for c in insp.get_columns('event_logs')}
        new_columns = [
            ('event_type', sa.String(64), 'TELEMETRY_CHANGE', True),
            ('entity_type', sa.String(64), None, True),
            ('entity_id', sa.String(64), None, True),
            ('title', sa.String(256), None, False),
            ('summary', sa.String(512), None, False),
            ('truth_type', sa.String(32), 'MEASURED', False),
            ('metadata_json', sa.Text(), None, False),
        ]
        for col_name, col_type, default_val, is_indexed in new_columns:
            if col_name not in existing_cols:
                op.add_column(
                    'event_logs',
                    sa.Column(
                        col_name,
                        col_type,
                        server_default=sa.text(f"'{default_val}'") if default_val else None,
                        nullable=True,
                    ),
                )
                if is_indexed:
                    try:
                        op.create_index(f"ix_event_logs_{col_name}", 'event_logs', [col_name])
                    except Exception:
                        pass


def downgrade() -> None:
    pass
