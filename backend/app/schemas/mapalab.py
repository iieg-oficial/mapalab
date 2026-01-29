from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date

class LayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tema: str
    subtema: Optional[str] = Field(default=None)
    link_final_capa: Optional[str] = Field(default=None)
    nombre_capa_db: Optional[str] = Field(default=None)
    nombre_capa_usuario: Optional[str] = Field(default=None)
    descripcion: Optional[str] = Field(default=None)
    frecuencia_actualizacion: Optional[str] = Field(default=None)
    fecha_ultima_actualizacion: Optional[date] = Field(default=None)
    rangos_periodicidad: Optional[str] = Field(default=None)
    metodologia_texto: Optional[str] = Field(default=None)
    metodologia_archivo_enlace: Optional[str] = Field(default=None)
    fuentes_texto: Optional[str] = Field(default=None)
    fuentes_enlace: Optional[str] = Field(default=None)
    tipo_mapa: Optional[str] = Field(default=None)
    tipo_mapa_enlace: Optional[str] = Field(default=None)
    metadato: Optional[str] = Field(default=None)
    tarjeta_punto_poligono: Optional[str] = Field(default=None)


class MetadataResponse(LayerResponse):
    periodicity: Optional[dict[str, dict[int, list[int]]]] = Field(default=None)
