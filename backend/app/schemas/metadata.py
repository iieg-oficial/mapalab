from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date

class LayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tema: str
    subtema: Optional[str] = Field(default=None)
    link_final_capa: Optional[str] = Field(default=None)
    capa_descargable: Optional[str] = Field(default=None)
    capa_finalizada_geoserver: Optional[str] = Field(default=None)
    nombre_capa_db: Optional[str] = Field(default=None)
    nombre_capa_geoserver: Optional[str] = Field(default=None)
    nombre_capa_usuario: Optional[str] = Field(default=None)
    descripcion: Optional[str] = Field(default=None)
    frecuencia_actualizacion: Optional[str] = Field(default=None)
    fecha_ultima_actualizacion: Optional[str] = Field(default=None)
    metodologia_texto: Optional[str] = Field(default=None)
    metodologia_archivo_enlace: Optional[str] = Field(default=None)
    fuentes_texto_largo: Optional[str] = Field(default=None)
    fuentes_texto_corto: Optional[str] = Field(default=None)
    fuentes_enlace: Optional[str] = Field(default=None)
    tipo_mapa: Optional[str] = Field(default=None)
    texto_leyenda_juridico: Optional[str] = Field(default=None)
    tipo_mapa_enlace: Optional[str] = Field(default=None)
    metadato_txt: Optional[str] = Field(default=None)
    metadato_xlsx: Optional[str] = Field(default=None)
    tarjeta_punto_poligono: Optional[str] = Field(default=None)
    created_at: Optional[date] = Field(default=None)

class MetadatoItem(BaseModel):
    nombre: str
    enlace: str

class FuenteItem(BaseModel):
    corto: Optional[str] = Field(default=None)
    largo: Optional[str] = Field(default=None)
    enlace: Optional[str] = Field(default=None)
    enlace_label: Optional[str] = Field(default=None)

class MetodologiaItem(BaseModel):
    texto: Optional[str] = Field(default=None)
    archivo_enlace: Optional[str] = Field(default=None)

class MetadataResponse(LayerResponse):
    numeralia: Optional[list] = Field(default = None)
    nombre_pie_numeralia : Optional[str] = Field(default = None)
    metadato: Optional[list[MetadatoItem]] = Field(default = None)
    fuentes: Optional[list[FuenteItem]] = Field(default = None)
    metodologia: Optional[list[MetodologiaItem]] = Field(default = None)

class LayerSourceResponse(BaseModel):
    nombre_capa_geoserver: str
    fuentes_texto_corto: Optional[str] = Field(default=None)
