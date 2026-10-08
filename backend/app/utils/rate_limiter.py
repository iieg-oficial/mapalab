import time
from collections import deque
from threading import Lock

_MAX_KEYS = 10000


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: dict[str, deque[float]] = {}
        self._lock = Lock()

    def _prune(self, cutoff: float) -> None:
        for key in [k for k, b in self._buckets.items() if not b or b[-1] < cutoff]:
            self._buckets.pop(key, None)

    def hit(self, key: str) -> bool:
        if not key:
            return True
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            if key not in self._buckets and len(self._buckets) >= _MAX_KEYS:
                self._prune(cutoff)
            bucket = self._buckets.setdefault(key, deque())
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.max_requests:
                return False
            bucket.append(now)
            return True
