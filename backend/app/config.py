import json

from typing import List, Literal, Optional, Union
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = []
    LOG_LEVEL: str = "INFO"
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_NAME: Optional[str] = Field(default=None)
    GEOSERVER_URL: Optional[str] = Field(default="")
    GEOSERVER_USER: Optional[str] = Field(default="")
    GEOSERVER_PASSWORD: Optional[str] = Field(default="")
    GEOSERVER_VERIFY_SSL: bool = Field(default=True)
    ACERVO_PUBLIC_URL: Optional[str] = Field(default=None)
    ACERVO_ENDPOINT: Optional[str] = Field(default=None)
    ACERVO_PUBLIC_ENDPOINT: Optional[str] = Field(default=None)
    ACERVO_ACCESS_KEY: Optional[str] = Field(default=None)
    ACERVO_SECRET_KEY: Optional[str] = Field(default=None)
    ACERVO_BUCKET: str = Field(default='mapalab')
    ACERVO_PRESIGN_TTL_SECONDS: int = Field(default=3600)
    DOWNLOAD_CACHE_TTL_HOURS: int = Field(default=36)
    DB_POOL_SIZE: int = Field(default=8)
    DB_MAX_OVERFLOW: int = Field(default=8)
    SENTRY_DSN: Optional[str] = Field(default=None)
    SENTRY_TRACES_SAMPLE_RATE: float = Field(default=0.1)
    MAPALAB_INTERNAL_TOKEN: Optional[str] = Field(default=None)
    MARIACHI_BACKEND_URL: Optional[str] = Field(default=None)
    EMBED_KEY_CACHE_TTL_SECONDS: int = Field(default=300)
    MCP_AUTH_ENABLED: bool = Field(default=True)
    MCP_QUOTA_FLUSH_INTERVAL_SECONDS: int = Field(default=60)
    MARIACHI_VERIFY_SSL: bool = Field(default=True)

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    @model_validator(mode="after")
    def validate_cors_in_production(self) -> "Settings":
        if self.ENVIRONMENT == "production" and "*" in self.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS no puede contener '*' en production")
        return self

    @property
    def get_database_url(self) -> str:
        if self.DB_NAME:
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}"

settings = Settings()

