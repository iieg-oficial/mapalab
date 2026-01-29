import json
from typing import List, Literal, Optional, Union
from pydantic import Field, field_validator
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

    @property
    def get_database_url(self) -> str:
        if self.DB_NAME:
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}"

settings = Settings()

