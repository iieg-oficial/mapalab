from app.utils.logger import Logger


class SchedulerService:
    @classmethod
    def start_scheduler(cls):
        Logger.info(
            'Scheduler deshabilitado — los jobs periodicos corren en dataengine-jobs '
            '(ver /IIEG/dataengine/jobs/crontab). '
            'Refresh manual: POST /layers/refresh-cache o POST /periodicity/refresh.'
        )

    @classmethod
    def stop_scheduler(cls):
        pass

    @classmethod
    def is_running(cls):
        return False
