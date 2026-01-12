from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Mapalab_Card(Base):
    __tablename__ = 'mapalab_card'
    id = Column(Integer, primary_key=True)
    tema = Column(String(1000), nullable=True)
    subtema = Column(String(1000), nullable=True)
    link_final_capa = Column(String(1000), nullable=True)
    nombre_capa_db = Column(String(1000), nullable=True)
    nombre_capa_usuario = Column(String(1000), nullable=True)
    descripcion = Column(String(1000), nullable=True)
    frecuencia_actualizacion = Column(String(1000), nullable=True)
    fecha_ultima_actualizacion = Column(Date, nullable=True)
    rangos_periodicidad = Column(String(1000), nullable=True)
    metodologia_texto = Column(String(1000), nullable=True)
    metodologia_archivo_enlace = Column(String(1000), nullable=True)
    fuentes_texto = Column(String(1000), nullable=True)
    fuentes_enlace = Column(String(1000), nullable=True)
    tipo_mapa = Column(String(1000), nullable=True)
    tipo_mapa_enlace = Column(String(1000), nullable=True)
    metadato = Column(String(1000), nullable=True)
    tarjeta_punto_poligono = Column(String(1000), nullable=True)
