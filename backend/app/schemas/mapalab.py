from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

class LayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    name: str
    theme: Optional[str] = None
    description: Optional[str] = None

class PeriodicityLayer(BaseModel):
    url: str
    fecha: Optional[dict[str, dict[int, list[int]]]] = None
