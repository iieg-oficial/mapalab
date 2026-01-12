import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.search_cache_service import SearchCacheService
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
            cls._regenerate_cache,
            trigger,
            id="cache_regeneration",
            name="Daily cache regeneration",
            replace_existing=True
        )

        cls._scheduler.start()
        Logger.info("Scheduler started")
        Logger.info("Cache will be regenerated daily at 3:00 AM")

    @classmethod
    def stop_scheduler(cls):
        if cls._scheduler is not None:
            cls._scheduler.shutdown()
            cls._scheduler = None
            Logger.info("Scheduler stopped")

    @classmethod
    def _regenerate_cache(cls):
        try:
            Logger.info("Starting scheduled cache regeneration...")
            cache = SearchCacheService.generate_cache()
            SearchCacheService.save_cache(cache)
            Logger.info("Scheduled cache regeneration completed successfully")
        except Exception as e:
            Logger.error(f"Error during scheduled cache regeneration: {str(e)}")

    @classmethod
    def is_running(cls):
        return cls._scheduler is not None and cls._scheduler.running
