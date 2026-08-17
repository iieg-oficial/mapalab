from typing import Any

from qgis.PyQt.QtWidgets import QHBoxLayout, QLabel, QLineEdit, QPushButton, QWidget

from ..theme import set_role, sombra_en_hover

PLACEHOLDER: str = 'https://dominio-del-iieg'


def fila_servidor(al_guardar: Any) -> tuple[QWidget, QLineEdit]:
    fila = QWidget()
    layout = QHBoxLayout()
    layout.setContentsMargins(0, 0, 0, 0)

    entrada = QLineEdit()
    entrada.setPlaceholderText(PLACEHOLDER)
    boton = QPushButton('Guardar')
    boton.clicked.connect(al_guardar)

    layout.addWidget(QLabel('Servidor:'))
    layout.addWidget(entrada)
    layout.addWidget(boton)
    fila.setLayout(layout)

    set_role(fila, 'card')
    set_role(boton, 'primary')
    return fila, entrada


def fila_acciones(al_agregar: Any, al_descargar: Any,
                  texto_agregar: str) -> tuple[QHBoxLayout, QPushButton, QPushButton]:
    fila = QHBoxLayout()

    agregar = QPushButton(texto_agregar)
    agregar.clicked.connect(al_agregar)
    descargar = QPushButton('Descargar vectorial')
    descargar.clicked.connect(al_descargar)

    fila.addWidget(agregar)
    fila.addWidget(descargar)

    set_role(agregar, 'primary')
    sombra_en_hover(agregar)
    set_role(descargar, 'secondary')
    return fila, agregar, descargar


def fila_limpieza(al_limpiar_seleccion: Any, al_limpiar: Any) -> QHBoxLayout:
    fila = QHBoxLayout()
    fila.addStretch(1)

    for texto, ayuda, accion in (
        ('Limpiar seleccionados', 'Quita las capas de selección que dejó la consulta por clic.',
         al_limpiar_seleccion),
        ('Limpiar', 'Quita del proyecto todas las capas que agregó MapaLab.', al_limpiar),
    ):
        boton = QPushButton(texto)
        boton.setToolTip(ayuda)
        boton.clicked.connect(accion)
        set_role(boton, 'quiet')
        fila.addWidget(boton)

    fila.addStretch(1)
    return fila
