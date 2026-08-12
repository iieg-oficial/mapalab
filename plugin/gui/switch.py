from typing import Optional

from qgis.PyQt.QtCore import Qt, pyqtSignal
from qgis.PyQt.QtWidgets import (
    QGraphicsDropShadowEffect,
    QHBoxLayout,
    QPushButton,
    QWidget,
)

from ..config import MODO_IIEG, MODO_INEGI
from ..theme import color_de_rol, set_role, sombra

ALTO: int = 26

RADIO: int = ALTO // 2

SOMBRA_BLUR: float = 10.0

SOMBRA_AIRE: int = 6

ETIQUETAS: tuple[tuple[str, str], ...] = ((MODO_IIEG, 'IIEG'), (MODO_INEGI, 'INEGI'))


def _reglas() -> str:
    primario = color_de_rol('primary', 'background-color', '#5C2472')
    sobre_primario = color_de_rol('primary', 'color', '#FFFFFF')
    acento = color_de_rol('badge', 'background-color', '#FF8300')
    sobre_acento = color_de_rol('badge', 'color', '#465055')
    superficie = color_de_rol('search', 'background-color', '#EAEFFA')

    return (
        f'QWidget[brandRole="switch"] {{ background-color: transparent; }}\n'
        f'QWidget[brandRole="switch"] QPushButton {{\n'
        f'    background-color: transparent;\n'
        f'    color: palette(text);\n'
        f'    border: 1px solid palette(mid);\n'
        f'    padding: 0px 10px;\n'
        f'    font-size: 12px;\n'
        f'    font-weight: 600;\n'
        f'}}\n'
        f'QWidget[brandRole="switch"] QPushButton[posicion="izquierda"] {{\n'
        f'    border-top-left-radius: {RADIO}px;\n'
        f'    border-bottom-left-radius: {RADIO}px;\n'
        f'    border-right: none;\n'
        f'}}\n'
        f'QWidget[brandRole="switch"] QPushButton[posicion="derecha"] {{\n'
        f'    border-top-right-radius: {RADIO}px;\n'
        f'    border-bottom-right-radius: {RADIO}px;\n'
        f'}}\n'
        f'QWidget[brandRole="switch"] QPushButton:hover {{\n'
        f'    background-color: {superficie};\n'
        f'}}\n'
        f'QWidget[brandRole="switch"] QPushButton[modo="{MODO_IIEG}"]:checked {{\n'
        f'    background-color: {primario};\n'
        f'    color: {sobre_primario};\n'
        f'    border: 1px solid {primario};\n'
        f'}}\n'
        f'QWidget[brandRole="switch"] QPushButton[modo="{MODO_INEGI}"]:checked {{\n'
        f'    background-color: {acento};\n'
        f'    color: {sobre_acento};\n'
        f'    border: 1px solid {acento};\n'
        f'}}\n'
        f'QWidget[brandRole="switch"] QPushButton:disabled {{\n'
        f'    color: palette(disabled-text);\n'
        f'}}\n'
    )


def _tooltip(etiqueta: str, activo: bool, hay_modo: bool) -> str:
    if activo:
        return f'Límites de {etiqueta} en el mapa'
    return f'Cambiar a {etiqueta}' if hay_modo else f'Activar capas {etiqueta}'


class SwitchModoBase(QWidget):

    cambiado = pyqtSignal(str)

    def __init__(self, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self._modo: Optional[str] = None
        self._botones: dict[str, QPushButton] = {}
        self._sombras: dict[str, QGraphicsDropShadowEffect] = {}

        layout = QHBoxLayout()
        layout.setContentsMargins(SOMBRA_AIRE, SOMBRA_AIRE, SOMBRA_AIRE, SOMBRA_AIRE)
        layout.setSpacing(0)

        for indice, (modo, etiqueta) in enumerate(ETIQUETAS):
            boton = QPushButton(etiqueta)
            boton.setCheckable(True)
            boton.setFixedHeight(ALTO)
            boton.setCursor(Qt.PointingHandCursor)
            boton.setProperty('modo', modo)
            boton.setProperty('posicion', 'izquierda' if indice == 0 else 'derecha')
            boton.clicked.connect(lambda _, elegido=modo: self._al_pulsar(elegido))
            layout.addWidget(boton)
            self._botones[modo] = boton
            self._sombras[modo] = sombra(boton, SOMBRA_BLUR)

        self.setLayout(layout)
        self.setFixedHeight(ALTO + 2 * SOMBRA_AIRE)
        set_role(self, 'switch')
        self.setStyleSheet(_reglas())
        self.mostrar(None)

    def modo(self) -> Optional[str]:
        return self._modo

    def mostrar(self, modo: Optional[str]) -> None:
        self._modo = modo
        for clave, etiqueta in ETIQUETAS:
            boton = self._botones[clave]
            activo = clave == modo
            boton.setChecked(activo)
            boton.setToolTip(_tooltip(etiqueta, activo, modo is not None))
            self._sombras[clave].setEnabled(activo)

    def _al_pulsar(self, modo: str) -> None:
        if modo == self._modo:
            self._botones[modo].setChecked(True)
            return
        self.cambiado.emit(modo)
