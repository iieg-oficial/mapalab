from typing import Any

from qgis.PyQt.QtWidgets import QHBoxLayout, QLabel, QLineEdit, QPushButton, QWidget

from ..theme import set_role

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
