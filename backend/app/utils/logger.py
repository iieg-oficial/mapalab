import logging
from rich.logging import RichHandler
from typing import Any
from app.config import Settings

FORMAT: str = "%(message)s"
logging.basicConfig(
    level=Settings.LOG_LEVEL, format=FORMAT, datefmt="[%X]", handlers=[RichHandler()]
)

log: logging = logging.getLogger("MapaLab")

class Logger:
    @staticmethod
    def info(message: Any) -> None:
        log.info(f'[white]{message}[/]', extra={"markup": True})

    @staticmethod
    def warning(message: Any) -> None:
        log.warning(f'[bold yellow]{message}[/]', extra={"markup": True})

    @staticmethod
    def error(message: Any) -> None:
        log.error(f'[bold red]{message}[/]', extra={"markup": True})

    @staticmethod
    def debug(message: Any) -> None:
        log.debug(f'[bold green] {message}[/]', extra={"markup": True})
