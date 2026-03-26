import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.periodicity_service import PeriodicityService
from app.utils.logger import Logger

class SchedulerService:
    _scheduler = None

    @classmethod
    def start_scheduler(cls):
        if cls._scheduler is not None:
            Logger.warning("Scheduler already running")
            return

        cls._scheduler = BackgroundScheduler()

        trigger = CronTrigger(
            hour=3,
            timezone=pytz.timezone('America/Mexico_City')
        )
        cls._scheduler.add_job(
            cls._refresh_periodicity,
            trigger,
            id="periodicity_refresh",
            name="Daily periodicity refresh",
            replace_existing=True
        )

        cls._scheduler.start()
        Logger.info("Scheduler started")

    @classmethod
    def stop_scheduler(cls):
        if cls._scheduler is not None:
            cls._scheduler.shutdown()
            cls._scheduler = None
            Logger.info("Scheduler stopped")

    @classmethod
    def _refresh_periodicity(cls):
        try:
            PeriodicityService.refresh()
        except Exception as e:
            Logger.error(f"Error during scheduled periodicity refresh: {str(e)}")

    @classmethod
    def is_running(cls):
        return cls._scheduler is not None and cls._scheduler.running
