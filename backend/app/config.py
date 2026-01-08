from typing import List, Literal, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["*"]
    LOG_LEVEL: str = "INFO"
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_NAME: Optional[str] = Field(default=None)
    GEOSERVER_URL: Optional[str] = Field(default="")
    GEOSERVER_USER: str
    GEOSERVER_PASSWORD: str

    @property
    def get_database_url(self) -> str:
        if self.DB_NAME:
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}"

settings = Settings()
