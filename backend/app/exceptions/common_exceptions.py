class BaseAppException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class NotFoundException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=404)

class BadRequestException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400)

class UnauthorizedException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=401)

class ForbiddenException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=403)

class ConflictException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=409)

class InternalServerException(BaseAppException):
    def __init__(self, message: str = "Internal server error"):
        super().__init__(message, status_code=500)
