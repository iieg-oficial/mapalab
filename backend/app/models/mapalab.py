from sqlalchemy import Column, Integer, String,  Text, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class MapalabMetadata(Base):
    __tablename__ = 'mapalab_metadata'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    tematica = Column(String(255))
    descripcion = Column(Text)
    municipio = Column(String(255))
    activo = Column(Boolean, default=True)

    @property
    def name(self):
        return self.nombre

    @property
    def theme(self):
        return self.tematica

    @property
    def description(self):
        return self.descripcion
