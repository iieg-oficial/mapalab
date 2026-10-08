import hashlib

from app.services import share_service


def test_hash_ip_usa_hmac_con_el_secreto(monkeypatch):
    monkeypatch.setattr(share_service.settings, 'MAPALAB_SHARE_IP_HASH_SECRET', 'uno')
    primero = share_service.hash_ip('10.0.0.1')
    monkeypatch.setattr(share_service.settings, 'MAPALAB_SHARE_IP_HASH_SECRET', 'dos')
    segundo = share_service.hash_ip('10.0.0.1')
    sin_secreto = hashlib.sha256(b'mapalab-share|10.0.0.1').hexdigest()
    assert primero and segundo and primero != segundo
    assert sin_secreto not in (primero, segundo)
    assert len(primero) == 64


def test_hash_ip_sin_secreto_no_guarda_nada(monkeypatch):
    monkeypatch.setattr(share_service.settings, 'MAPALAB_SHARE_IP_HASH_SECRET', None)
    assert share_service.hash_ip('10.0.0.1') is None
    monkeypatch.setattr(share_service.settings, 'MAPALAB_SHARE_IP_HASH_SECRET', 'uno')
    assert share_service.hash_ip(None) is None
