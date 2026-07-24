from typing import Iterator, Optional

import boto3
from botocore.client import Config

from app.config import settings


_presign_client = None
_internal_client = None

_STREAM_CHUNK_SIZE = 64 * 1024


def _get_presign_client():
    global _presign_client
    if _presign_client is None:
        if not (settings.ACERVO_ACCESS_KEY and settings.ACERVO_SECRET_KEY):
            return None
        endpoint = settings.ACERVO_PUBLIC_ENDPOINT or settings.ACERVO_ENDPOINT
        if not endpoint:
            return None
        _presign_client = boto3.client(
            's3',
            endpoint_url=endpoint,
            aws_access_key_id=settings.ACERVO_ACCESS_KEY,
            aws_secret_access_key=settings.ACERVO_SECRET_KEY,
            region_name='us-east-1',
            config=Config(signature_version='s3v4'),
        )
    return _presign_client


def _get_internal_client():
    global _internal_client
    if _internal_client is None:
        if not (settings.ACERVO_ACCESS_KEY and settings.ACERVO_SECRET_KEY):
            return None
        if not settings.ACERVO_ENDPOINT:
            return None
        _internal_client = boto3.client(
            's3',
            endpoint_url=settings.ACERVO_ENDPOINT,
            aws_access_key_id=settings.ACERVO_ACCESS_KEY,
            aws_secret_access_key=settings.ACERVO_SECRET_KEY,
            region_name='us-east-1',
            config=Config(signature_version='s3v4'),
        )
    return _internal_client


def presign_get(object_key: str, ttl_seconds: Optional[int] = None) -> Optional[str]:
    client = _get_presign_client()
    if client is None:
        return None
    ttl = ttl_seconds if ttl_seconds is not None else settings.ACERVO_PRESIGN_TTL_SECONDS
    return client.generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.ACERVO_BUCKET, 'Key': object_key},
        ExpiresIn=ttl,
    )


def open_object(object_key: str) -> Optional[dict]:
    client = _get_internal_client()
    if client is None:
        return None
    try:
        return client.get_object(Bucket=settings.ACERVO_BUCKET, Key=object_key)
    except Exception:
        return None


def iter_object_body(obj: dict) -> Iterator[bytes]:
    body = obj['Body']
    try:
        yield from body.iter_chunks(chunk_size=_STREAM_CHUNK_SIZE)
    finally:
        body.close()
