#!/usr/bin/env python3
"""
MapaLab - Layer Verification Script

Verifies all layers work correctly:
  1. WMS GetMap     → layer is visible on the map
  2. WFS CSV        → CSV download works (with CQL_FILTER when applicable)
  3. WFS GPKG       → GeoPackage download works
  4. WFS SHP        → Shapefile download works
  5. WCS GeoTIFF    → Raster download works (raster layers only)
  6. Backend metadata → metadata endpoint returns data
  7. Backend CSV     → backend streaming CSV works

Usage:
  python3 scripts/test_layers.py
  python3 scripts/test_layers.py --workspace salud
  python3 scripts/test_layers.py --layer unidades_salud
"""

import argparse
import requests
import sys
import time
from collections import defaultdict

GEOSERVER_URL = "http://localhost:8080/geoserver"
BACKEND_URL = "http://localhost:8081/api"

BBOX = "-105.70,18.95,-101.47,22.75"
SRS = "EPSG:6368"
TIMEOUT = 120

# Workspace key mappings (frontend key → GeoServer workspace name)
WORKSPACE_MAP = {
    "seguridad": "seguridad_y_proteccion_ciudadana",
    "gobierno": "gobierno_y_ciudadania",
    "desarrollo": "desarrollo_social",
    "recursos": "recursos_y_calidad_de_vida",
}

RASTER_YEAR = 2025

# ──────────────────────────────────────────────────────────────────────────────
# Layer definitions
# Format: (frontend_ws, gs_workspace, gs_layer, layer_type, cql_filter, wfs_layer_override)
#   - cql_filter: if set, used in WFS downloads (filtered sublayer)
#   - wfs_layer_override: if set, used as WFS typeName instead of gs_layer (for layer groups)
# ──────────────────────────────────────────────────────────────────────────────

LAYERS = [
    # ── SALUD ─────────────────────────────────────────────────────────────────
    # Group download (no filter = full table)
    ("salud", "salud", "unidades_salud", "vector", None, None),
    # Representative filtered sublayers
    ("salud", "salud", "unidades_salud", "vector",
     "nombre_institucion = 'Instituto Mexicano del Seguro Social' AND nivel_atencion = 'Primer nivel'", None),
    ("salud", "salud", "unidades_salud", "vector",
     "nombre_institucion = 'Cruz Roja Mexicana' AND nivel_atencion = 'Primer nivel'", None),
    ("salud", "salud", "unidades_salud", "vector",
     "nombre_institucion = 'Servicios Medicos Privados' AND nivel_atencion = 'Segundo nivel'", None),
    ("salud", "salud", "unidades_salud", "vector",
     "nombre_institucion = 'Instituto Mexicano del Seguro Social' AND nivel_atencion = 'Tercer nivel'", None),

    # ── DESARROLLO SOCIAL ─────────────────────────────────────────────────────
    ("desarrollo", "desarrollo_social", "carencia_acceso_servicios_salud", "vector", None, None),
    ("desarrollo", "desarrollo_social", "pobreza", "vector", None, None),
    ("desarrollo", "desarrollo_social", "pobreza_extrema", "vector", None, None),
    ("desarrollo", "desarrollo_social", "pobreza_moderada", "vector", None, None),
    ("desarrollo", "desarrollo_social", "vulnerables_por_carencia_social", "vector", None, None),
    ("desarrollo", "desarrollo_social", "vulnerables_por_ingreso", "vector", None, None),
    ("desarrollo", "desarrollo_social", "no_pobre_y_no_vulnerable", "vector", None, None),
    ("desarrollo", "desarrollo_social", "carencia_acceso_alimentacion", "vector", None, None),
    ("desarrollo", "desarrollo_social", "carencia_servicios_basicos_vivienda", "vector", None, None),
    ("desarrollo", "desarrollo_social", "carencia_acceso_seguridad_social", "vector", None, None),
    ("desarrollo", "desarrollo_social", "rezago_educativo", "vector", None, None),
    ("desarrollo", "desarrollo_social", "poblacion_con_al_menos_una_carencia_social", "vector", None, None),
    ("desarrollo", "desarrollo_social", "poblacion_con_tres_o_mas_carencias_sociales", "vector", None, None),
    ("desarrollo", "desarrollo_social", "poblacion_ingreso_inferior_linea_pobreza_ingresos", "vector", None, None),
    ("desarrollo", "desarrollo_social", "poblacion_ingreso_inferior_linea_pobreza_extrema_ingresos", "vector", None, None),
    ("desarrollo", "desarrollo_social", "feminicidios", "vector", None, None),
    ("desarrollo", "desarrollo_social", "brecha_salarial", "vector", None, None),
    ("desarrollo", "desarrollo_social", "nacimientos_infantiles", "vector", None, None),
    ("desarrollo", "desarrollo_social", "nacimientos_adolescentes", "vector", None, None),

    # ── GOBIERNO ──────────────────────────────────────────────────────────────
    ("gobierno", "gobierno_y_ciudadania", "ingresos_totales_reales_per_capita_precios_2023", "vector", None, None),
    ("gobierno", "gobierno_y_ciudadania", "porcentaje_egresos_deuda_publica", "vector", None, None),
    ("gobierno", "gobierno_y_ciudadania", "porcentaje_ingresos_financiamiento", "vector", None, None),
    ("gobierno", "gobierno_y_ciudadania", "porcentaje_ingresos_participaciones", "vector", None, None),
    ("gobierno", "gobierno_y_ciudadania", "porcentaje_ingresos_propios", "vector", None, None),

    # ── DEMOGRAFIA ────────────────────────────────────────────────────────────
    ("demografia", "demografia", "poblacion", "vector", None, None),
    ("demografia", "demografia", "poblacion_mujeres", "vector", None, None),
    ("demografia", "demografia", "poblacion_hombres", "vector", None, None),
    ("demografia", "demografia", "tasa_fecundidad", "vector", None, None),
    ("demografia", "demografia", "razon_dependencia_infantil", "vector", None, None),
    ("demografia", "demografia", "razon_dependencia_adulta", "vector", None, None),
    ("demografia", "demografia", "razon_dependencia", "vector", None, None),
    ("demografia", "demografia", "edad_mediana", "vector", None, None),

    # ── EDUCACION ─────────────────────────────────────────────────────────────
    ("educacion", "educacion", "centros_educativos", "vector", None, None),
    # Filtered sublayers
    ("educacion", "educacion", "centros_educativos", "vector", "nivel_educativo = 'Preescolar'", None),
    ("educacion", "educacion", "centros_educativos", "vector", "nivel_educativo = 'Primaria'", None),
    ("educacion", "educacion", "centros_educativos", "vector", "nivel_educativo = 'Secundaria'", None),

    # ── ECONOMIA ──────────────────────────────────────────────────────────────
    ("economia", "economia", "tasa_desocupacion", "vector", None, None),
    ("economia", "economia", "ocupacion_informal", "vector", None, None),
    ("economia", "economia", "trabajadores_asegurados", "vector", None, None),
    ("economia", "economia", "trabajadores_asegurados_mujeres", "vector", None, None),
    ("economia", "economia", "trabajadores_asegurados_hombres", "vector", None, None),
    ("economia", "economia", "cultivos", "vector", None, None),
    # Filtered cultivos (field is 'prediccion')
    ("economia", "economia", "cultivos", "vector", "prediccion = 'Agave'", None),
    ("economia", "economia", "cultivos", "vector", "prediccion = 'Maíz grano'", None),

    # ── GENERAL (base layers) ─────────────────────────────────────────────────
    ("general", "general", "cuerpos_de_agua_50k", "vector", None, None),
    ("general", "general", "cabeceras_municipales", "vector", None, None),
    ("general", "general", "carretera_2012", "vector", None, None),
    ("general", "general", "carretera_2012", "vector", "transito = 'Libre'", None),
    ("general", "general", "carretera_2012", "vector", "transito = 'Cuota'", None),
    ("general", "general", "aeropuertos", "vector", None, None),
    ("general", "general", "aeropuertos", "vector", "tipo = 'Aeropuerto Internacional'", None),
    ("general", "general", "limite_municipal", "vector", None, None),
    ("general", "general", "limite_municipal_inegi", "vector", None, None),
    ("general", "general", "regiones", "vector", None, None),
    # Layer groups → WFS uses the underlying featureType; backend CSV not available (expected)
    ("general", "general", "limite_iieg", "vector", None, "limite_estatal"),
    ("general", "general", "limite_inegi", "vector", None, "limite_estatal_inegi"),
    ("general", "general", "caminos_2012", "vector", None, None),

    # ── RECURSOS Y CALIDAD DE VIDA ────────────────────────────────────────────
    ("recursos", "recursos_y_calidad_de_vida", "espacios_publicos_y_lugares_recreativos", "vector", None, None),
    ("recursos", "recursos_y_calidad_de_vida", "espacios_publicos_y_lugares_recreativos", "vector",
     "tipo_lugar = 'Instalación deportiva o recreativa'", None),
    ("recursos", "recursos_y_calidad_de_vida", "disponibilidad_acuiferos_2023", "vector", None, None),
    ("recursos", "recursos_y_calidad_de_vida", "area_de_proteccion_bosque_la_primavera", "vector", None, None),
    ("recursos", "recursos_y_calidad_de_vida", "agave_en_area_de_proteccion_de_flora_y_fauna_bosque_la_primaver", "vector", None, None),
    ("recursos", "recursos_y_calidad_de_vida", "parcelas_dentro_de_anp_bosque_de_la_primavera", "vector", None, None),
    ("recursos", "recursos_y_calidad_de_vida", "itur_iieg", "vector", None, None),
    ("recursos", "recursos_y_calidad_de_vida", "uso_de_suelo_serie_7", "vector", None, None),

    # ── RASTER ────────────────────────────────────────────────────────────────
    ("raster", "raster", "temperaturas", "raster", None, None),
    ("raster", "raster", f"temperatura_media_anual_{RASTER_YEAR}_promedio", "raster", None, None),
    ("raster", "raster", "precipitacion", "raster", None, None),
    ("raster", "raster", f"lluvia_anual_{RASTER_YEAR}", "raster", None, None),

    # ── SEGURIDAD - Secretariado (tasas) ──────────────────────────────────────
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_feminicidio_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_homicidio_doloso_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_lesiones_dolosas_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_violacion_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_abuso_sexual_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_violencia_familiar_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_coche_cuatro_ruedas_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_transportista_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_motocicleta_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_transeunte_via_publica_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_casa_habitacion_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_negocio_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_autopartes_secretariado", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "datos_delitos_robo_institucion_bancaria_secretariado", "vector", None, None),

    # ── SEGURIDAD - Fiscalia (puntos) ─────────────────────────────────────────
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_feminicidio", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_homicidio_doloso", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_lesiones_dolosas", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_abuso_sexual_infantil", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_violacion", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_violencia_familiar", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_vehiculos_particulares", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_carga_pesada", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_motocicleta", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_persona", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_casa_habitacion", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_negocio", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_autopartes", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_int_vehiculos", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_cuentahabientes", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "delitos_fiscalia_robo_bancos", "vector", None, None),

    # ── SEGURIDAD - Desaparecidos ─────────────────────────────────────────────
    ("seguridad", "seguridad_y_proteccion_ciudadana", "personas_desaparecidas", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "personas_desaparecidas", "vector", "tasa_mujeres IS NOT NULL", None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "personas_desaparecidas", "vector", "tasa_hombres IS NOT NULL", None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "personas_localizadas", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "personas_localizadas_mujeres", "vector", None, None),
    ("seguridad", "seguridad_y_proteccion_ciudadana", "personas_localizadas_hombres", "vector", None, None),
]


# ──────────────────────────────────────────────────────────────────────────────
# Test functions
# ──────────────────────────────────────────────────────────────────────────────

def test_wms(workspace, layer):
    url = f"{GEOSERVER_URL}/{workspace}/wms"
    params = {
        "service": "WMS", "version": "1.1.0", "request": "GetMap",
        "layers": f"{workspace}:{layer}",
        "bbox": BBOX, "width": 256, "height": 256,
        "srs": SRS, "format": "image/png", "transparent": "true",
    }
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT)
        ct = r.headers.get("Content-Type", "")
        if r.status_code == 200 and "image/png" in ct:
            return "OK", f"{len(r.content)} bytes"
        return "ERROR", f"HTTP {r.status_code} {ct[:60]}"
    except Exception as e:
        return "ERROR", str(e)[:80]


def test_wfs(workspace, layer, output_format, cql_filter=None, wfs_layer=None):
    type_name = f"{workspace}:{wfs_layer or layer}"
    url = f"{GEOSERVER_URL}/{workspace}/wfs"
    params = {
        "service": "WFS", "version": "1.0.0", "request": "GetFeature",
        "typeName": type_name, "maxFeatures": 1, "outputFormat": output_format,
    }
    if cql_filter:
        params["CQL_FILTER"] = cql_filter
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT, stream=True)
        status = r.status_code
        ct = r.headers.get("Content-Type", "")
        cl = r.headers.get("Content-Length", "?")
        chunk = next(r.iter_content(4096), b"")
        r.close()
        if status == 200 and len(chunk) > 0:
            if b"ExceptionReport" in chunk or b"ServiceException" in chunk:
                return "ERROR", chunk.decode(errors="replace")[:120]
            return "OK", f"content-length={cl}, chunk={len(chunk)} bytes"
        return "ERROR", f"HTTP {status} {ct[:60]}"
    except Exception as e:
        return "ERROR", str(e)[:80]


def test_wcs(workspace, layer):
    url = f"{GEOSERVER_URL}/{workspace}/wcs"
    params = {
        "service": "WCS", "version": "2.0.1", "request": "GetCoverage",
        "coverageId": f"{workspace}__{layer}", "format": "image/geotiff",
    }
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT, stream=True)
        chunk = next(r.iter_content(4096), b"")
        r.close()
        if r.status_code == 200 and len(chunk) > 0:
            if b"ExceptionReport" in chunk or b"ServiceException" in chunk:
                return "ERROR", chunk.decode(errors="replace")[:120]
            return "OK", f"{len(chunk)} bytes"
        return "ERROR", f"HTTP {r.status_code}"
    except Exception as e:
        return "ERROR", str(e)[:80]


def test_metadata(workspace, layer):
    url = f"{BACKEND_URL}/metadata/"
    params = {"workspace": workspace, "layer": layer}
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and len(data) > 0:
                n_meta = len(data[0].get("metadato") or [])
                descargable = data[0].get("capa_descargable", "?")
                return "OK", f"{len(data)} reg, {n_meta} metadatos, descargable={descargable}"
            return "EMPTY", "Sin registros"
        return "ERROR", f"HTTP {r.status_code}"
    except Exception as e:
        return "ERROR", str(e)[:80]


def test_backend_csv(frontend_ws, layer):
    url = f"{BACKEND_URL}/download/{frontend_ws}/{layer}"
    try:
        r = requests.get(url, timeout=TIMEOUT, stream=True)
        if r.status_code == 200:
            chunk = next(r.iter_content(4096), b"")
            r.close()
            return ("OK", f"{len(chunk)} bytes") if chunk else ("EMPTY", "Sin datos")
        if r.status_code == 404:
            return "NOT_FOUND", "No existe en mapalab_card"
        return "ERROR", f"HTTP {r.status_code}"
    except Exception as e:
        return "ERROR", str(e)[:80]


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def label_for(ws, layer, cql, wfs_override):
    base = f"{ws}:{layer}"
    extras = []
    if cql:
        extras.append(f"CQL={cql[:40]}...")
    if wfs_override:
        extras.append(f"wfs→{wfs_override}")
    return f"{base}  ({', '.join(extras)})" if extras else base


def main():
    parser = argparse.ArgumentParser(description="MapaLab layer verification")
    parser.add_argument("--workspace", "-w", help="Filter by GeoServer workspace")
    parser.add_argument("--layer", "-l", help="Filter by layer name (partial match)")
    args = parser.parse_args()

    filtered = LAYERS
    if args.workspace:
        filtered = [l for l in filtered if args.workspace.lower() in l[1].lower()]
    if args.layer:
        filtered = [l for l in filtered if args.layer.lower() in l[2].lower()]

    if not filtered:
        print("No layers matched the filter.")
        sys.exit(1)

    total = len(filtered)
    print(f"{'=' * 110}")
    print(f"  MAPALAB LAYER VERIFICATION  ({total} tests)")
    print(f"{'=' * 110}")

    results = []

    for i, (frontend_ws, gs_ws, layer, ltype, cql, wfs_override) in enumerate(filtered):
        tag = label_for(gs_ws, layer, cql, wfs_override)
        print(f"\n[{i+1}/{total}] {tag}  ({ltype})")

        row = {"ws": gs_ws, "layer": layer, "type": ltype, "frontend_ws": frontend_ws,
               "cql": cql, "wfs_override": wfs_override, "tag": tag}

        # WMS
        s, d = test_wms(gs_ws, layer)
        row["wms"] = s
        print(f"  WMS          {s:10s}  {d}")

        if ltype == "vector":
            wfs_layer = wfs_override or layer
            for fmt_key, fmt_label, fmt_id in [
                ("wfs_csv", "WFS CSV", "csv"),
                ("wfs_gpkg", "WFS GPKG", "application/geopackage+sqlite3"),
                ("wfs_shp", "WFS SHP", "SHAPE-ZIP"),
            ]:
                s, d = test_wfs(gs_ws, layer, fmt_id, cql, wfs_override)
                row[fmt_key] = s
                print(f"  {fmt_label:12s}  {s:10s}  {d}")
                time.sleep(0.1)
        else:
            s, d = test_wcs(gs_ws, layer)
            row["wcs"] = s
            print(f"  WCS TIFF     {s:10s}  {d}")

        # Metadata (skip for filtered sublayers, same metadata as parent)
        if not cql:
            s, d = test_metadata(gs_ws, layer)
            row["metadata"] = s
            print(f"  Metadata     {s:10s}  {d}")

        # Backend CSV (skip for raster, filtered, and layer groups - backend can't handle those)
        if ltype == "vector" and not cql and not wfs_override:
            s, d = test_backend_csv(frontend_ws, layer)
            row["backend_csv"] = s
            print(f"  Backend CSV  {s:10s}  {d}")

        results.append(row)

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'=' * 110}")
    print("  SUMMARY")
    print(f"{'=' * 110}")

    checks = [
        ("wms", "WMS GetMap (visible)"),
        ("wfs_csv", "WFS CSV download"),
        ("wfs_gpkg", "WFS GPKG download"),
        ("wfs_shp", "WFS SHP download"),
        ("wcs", "WCS GeoTIFF (raster)"),
        ("metadata", "Backend metadata"),
        ("backend_csv", "Backend CSV download"),
    ]

    # Known issues that are expected and not counted as failures
    KNOWN_ISSUES = {
        ("gobierno_y_ciudadania", "porcentaje_ingresos_propios", "metadata"):
            "Nombre no coincide con mapalab_card (ingresos_propios vs porcentaje_ingresos_propios)",
    }

    all_ok = True
    for key, label in checks:
        counted = [r for r in results if key in r]
        if not counted:
            continue
        ok = sum(1 for r in counted if r[key] == "OK")
        fail = len(counted) - ok
        mark = "  " if fail == 0 else "!!"
        if fail > 0:
            all_ok = False
        print(f"  {mark} {label:30s}  OK: {ok:3d} / {len(counted):3d}   FAIL: {fail}")

    # ── Failures detail ───────────────────────────────────────────────────────
    failures = [r for r in results if any(r.get(k) not in ("OK", None) for k, _ in checks if k in r)]
    real_failures = []
    known_list = []

    for r in failures:
        failed_checks = [k for k, _ in checks if k in r and r[k] != "OK"]
        is_known = all((r["ws"], r["layer"], k) in KNOWN_ISSUES for k in failed_checks)
        if is_known:
            known_list.append(r)
        else:
            real_failures.append(r)

    if known_list:
        print(f"\n{'=' * 110}")
        print("  KNOWN ISSUES (not counted as failures)")
        print(f"{'=' * 110}")
        for r in known_list:
            failed_checks = [k for k, _ in checks if k in r and r[k] != "OK"]
            print(f"\n  {r['tag']}")
            for k in failed_checks:
                reason = KNOWN_ISSUES.get((r["ws"], r["layer"], k), "")
                print(f"    {k:14s} → {r[k]}  ({reason})")

    if real_failures:
        print(f"\n{'=' * 110}")
        print("  FAILURES")
        print(f"{'=' * 110}")
        for r in real_failures:
            failed_checks = [k for k, _ in checks if k in r and r[k] != "OK"]
            print(f"\n  {r['tag']}")
            for k in failed_checks:
                print(f"    {k:14s} → {r[k]}")

    print()
    has_real_failures = len(real_failures) > 0
    if not has_real_failures:
        print("  ALL CHECKS PASSED" + (f" ({len(known_list)} known issues)" if known_list else ""))
    else:
        print(f"  {len(real_failures)} layer(s) with unexpected failures")

    sys.exit(0 if not has_real_failures else 1)


if __name__ == "__main__":
    main()
