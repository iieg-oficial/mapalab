import os
from typing import Optional

import asyncpg

from app.config import settings
from app.consts.databases import DatabaseType


_pool: Optional[asyncpg.Pool] = None


def _resolve_db_name() -> str:
    override = os.getenv(f"{DatabaseType.MAPALAB.name}_DB_NAME")
    if override:
        return override
    if settings.DB_NAME:
        return settings.DB_NAME
    return DatabaseType.MAPALAB.value


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.DB_HOST,
            port=int(settings.DB_PORT),
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=_resolve_db_name(),
            ssl='require',
            min_size=1,
            max_size=max(settings.DB_POOL_SIZE, 4),
            command_timeout=600,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
