from __future__ import annotations

import fcntl
import os
import tempfile
from typing import Optional

MAX_CONCURRENT_DOWNLOADS = 3
_SLOT_DIR = os.path.join(tempfile.gettempdir(), 'mapalab_download_slots')


class DownloadSlot:
    def __init__(self, handle) -> None:
        self._handle = handle

    def release(self) -> None:
        if self._handle is None:
            return
        try:
            fcntl.flock(self._handle, fcntl.LOCK_UN)
        finally:
            self._handle.close()
            self._handle = None


def try_acquire(limit: int = MAX_CONCURRENT_DOWNLOADS) -> Optional[DownloadSlot]:
    os.makedirs(_SLOT_DIR, exist_ok=True)
    for index in range(limit):
        handle = open(os.path.join(_SLOT_DIR, f'slot_{index}.lock'), 'a')
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            handle.close()
            continue
        return DownloadSlot(handle)
    return None
