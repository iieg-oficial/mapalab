from typing import Optional
from urllib.parse import urlparse

from fastapi import Request


def get_client_ip(request: Request) -> Optional[str]:
    real = request.headers.get('x-real-ip')
    if real and real.strip():
        return real.strip()
    if request.client:
        return request.client.host
    return None


def get_request_origin(request: Request) -> Optional[str]:
    origin = request.headers.get('origin')
    if origin and origin.lower() != 'null':
        return origin
    referer = request.headers.get('referer')
    if not referer:
        return None
    try:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        pass
    return None
