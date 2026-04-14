#!/usr/bin/env python3
"""
Stress test con usuarios reales — MapaLab

Uso:
  python stress_test.py --env local                          # local (https://localhost)
  python stress_test.py --env staging                        # GCP staging
  python stress_test.py --env production                     # produccion
  python stress_test.py --url https://mi-dominio.com/mapalab/mapa  # URL custom

  python stress_test.py --env local --mode fixed --users 80
  python stress_test.py --env staging --mode ramp --users 200 --ramp-steps 8
  python stress_test.py --env production --mode ramp --users 200 --ramp-steps 1 --sessions 5

Entornos:
  local       https://localhost/mapalab/mapa      (ssl=False)
  staging     Leer de env var STRESS_TEST_STAGING_URL o pasar --url
  production  Leer de env var STRESS_TEST_PRODUCTION_URL o pasar --url

Simula visitas completas (igual que un navegador real):
  1. GET página principal → HTML + cookies de sesión
  2. GET de todos los CSS/JS referenciados en paralelo
  3. Think time 1–3 s (el usuario "lee" la página)

Reporta:
  - RPS de carga   : sesiones / tiempo total (incluye think time)
  - RPS servidor   : throughput real del servidor (solo tiempo de red)
  - Latencias p50/p90/p95/p99
  - Punto de quiebre automático
"""

import asyncio
import aiohttp
import argparse
import os
import random
import re
import statistics
import time
from collections import defaultdict
from datetime import datetime
from urllib.parse import urljoin, urlparse

ENVS = {
    "local": {
        "url": "https://localhost/mapalab/mapa",
        "ssl": False,
    },
    "staging": {
        "url": os.environ.get("STRESS_TEST_STAGING_URL", ""),
        "ssl": True,
    },
    "production": {
        "url": os.environ.get("STRESS_TEST_PRODUCTION_URL", ""),
        "ssl": True,
    },
}

URL      = ""
BASE_URL = ""
SSL_VERIFY = True

TIMEOUT = aiohttp.ClientTimeout(total=30, connect=10)


def configure_target(env: str, url: str):
    global URL, BASE_URL, SSL_VERIFY

    if url:
        URL = url
    elif env and env in ENVS:
        cfg = ENVS[env]
        URL = cfg["url"]
        SSL_VERIFY = cfg["ssl"]
    else:
        URL = ENVS["local"]["url"]
        SSL_VERIFY = False

    if not URL:
        print(f"\n  Error: No hay URL para el entorno '{env}'.")
        print(f"  Configura la variable de entorno STRESS_TEST_{env.upper()}_URL")
        print(f"  o usa --url para pasar la URL directamente.\n")
        raise SystemExit(1)

    parsed = urlparse(URL)
    BASE_URL = f"{parsed.scheme}://{parsed.netloc}"

# ── Criterios de quiebre ──────────────────────────────────────────────────────
BREAK_ERROR_RATE = 30.0   # % de sesiones fallidas
BREAK_P95_MS     = 4_000  # ms de latencia p95 de la página principal

# Encabezados de navegador real
HEADERS_PAGE = {
    "User-Agent":                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language":           "es-MX,es;q=0.8,en-US;q=0.5",
    "Accept-Encoding":           "gzip, deflate, br",
    "Connection":                "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest":            "document",
    "Sec-Fetch-Mode":            "navigate",
    "Sec-Fetch-Site":            "none",
}
HEADERS_ASSET = {
    "User-Agent":      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept":          "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection":      "keep-alive",
}


# ── Extracción de assets ──────────────────────────────────────────────────────

def extract_assets(html):
    """Extrae CSS/JS del mismo dominio, igual que haría un navegador."""
    assets = []
    base_host = urlparse(BASE_URL).netloc
    patterns = [
        r'<link[^>]+href=["\']([^"\']+\.css(?:\?[^"\']*)?)["\']',
        r'<script[^>]+src=["\']([^"\']+\.js(?:\?[^"\']*)?)["\']',
    ]
    for pat in patterns:
        for m in re.finditer(pat, html, re.IGNORECASE):
            url = urljoin(BASE_URL, m.group(1))
            if urlparse(url).netloc == base_host:
                assets.append(url)
    return assets[:25]


# ── Sesión de usuario real ────────────────────────────────────────────────────

async def real_user_session(connector):
    """
    Simula una visita completa: HTML → assets en paralelo → think time.
    Devuelve un dict con métricas de la visita.
    Cada llamada crea su propio CookieJar (navegadores independientes).
    """
    result = {
        "page_status":  None,
        "page_elapsed": 0.0,
        "work_elapsed": 0.0,   # tiempo neto de red (sin think time)
        "assets_ok":    0,
        "assets_fail":  0,
        "error":        None,
        "success":      False,
    }

    jar = aiohttp.CookieJar(unsafe=True)
    async with aiohttp.ClientSession(
        connector=connector, connector_owner=False, cookie_jar=jar
    ) as session:

        # 1. Página principal
        t0 = time.perf_counter()
        try:
            async with session.get(URL, headers=HEADERS_PAGE, timeout=TIMEOUT) as resp:
                result["page_status"] = resp.status
                html = await resp.text(errors="replace")
        except asyncio.TimeoutError:
            result["error"] = "TIMEOUT"
            result["page_elapsed"] = time.perf_counter() - t0
            return result
        except aiohttp.ClientConnectorError:
            result["error"] = "CONNECTION_ERROR"
            result["page_elapsed"] = time.perf_counter() - t0
            return result
        except Exception as e:
            result["error"] = type(e).__name__
            result["page_elapsed"] = time.perf_counter() - t0
            return result

        result["page_elapsed"] = time.perf_counter() - t0

        if not (result["page_status"] and 200 <= result["page_status"] < 400):
            return result

        # 2. Assets CSS/JS en paralelo
        assets = extract_assets(html)

        async def fetch_asset(url):
            try:
                async with session.get(url, headers=HEADERS_ASSET, timeout=TIMEOUT) as r:
                    await r.read()
                    return r.status < 400
            except Exception:
                return False

        if assets:
            asset_results = await asyncio.gather(*[fetch_asset(u) for u in assets])
            result["assets_ok"]   = sum(1 for r in asset_results if r)
            result["assets_fail"] = sum(1 for r in asset_results if not r)

        result["success"]      = True
        result["work_elapsed"] = time.perf_counter() - t0  # tiempo neto de red

        # 3. Think time: el usuario "lee" la página
        await asyncio.sleep(random.uniform(1.0, 3.0))

    return result


# ── Worker continuo ───────────────────────────────────────────────────────────

async def user_worker(worker_id, connector, start_barrier, stop_event, bucket, sessions_per_user=1):
    """
    Espera la señal de arranque y ejecuta exactamente `sessions_per_user` visitas
    completas en secuencia. stop_event permite cancelación anticipada entre sesiones.
    """
    await start_barrier.wait()
    for _ in range(sessions_per_user):
        if stop_event.is_set():
            break
        r = await real_user_session(connector)
        bucket.append(r)


# ── Análisis de snapshot ──────────────────────────────────────────────────────

def analyze_snapshot(bucket, current_users, elapsed):
    """Analiza el estado actual de `bucket` y devuelve métricas."""
    ok     = [r for r in bucket if r["success"]]
    failed = [r for r in bucket if not r["success"]]
    times  = [r["page_elapsed"] for r in ok]
    total  = len(bucket)

    status_counts = defaultdict(int)
    error_counts  = defaultdict(int)
    for r in bucket:
        if r["page_status"]:
            status_counts[r["page_status"]] += 1
        if r["error"]:
            error_counts[r["error"]] += 1

    error_rate = len(failed) / total * 100 if total else 0.0

    sorted_times = sorted(times)
    def pct(p):
        if len(sorted_times) < 2:
            return None
        return sorted_times[int(len(sorted_times) * p)] * 1000

    p95 = pct(0.95)

    # RPS real del servidor (tiempo neto de red × concurrentes / suma work_elapsed)
    total_work_s = sum(r["work_elapsed"] for r in ok)
    server_rps = len(ok) / total_work_s * current_users if total_work_s > 0 else 0.0

    is_breaking = error_rate > BREAK_ERROR_RATE or (p95 is not None and p95 > BREAK_P95_MS)

    return {
        "users":         current_users,
        "total":         total,
        "ok":            len(ok),
        "errors":        len(failed),
        "error_rate":    error_rate,
        "elapsed":       elapsed,
        "rps_load":      total / elapsed if elapsed > 0 else 0,
        "server_rps":    server_rps,
        "avg_ms":        statistics.mean(times) * 1000   if times else None,
        "median_ms":     statistics.median(times) * 1000 if times else None,
        "p90_ms":        pct(0.90),
        "p95_ms":        p95,
        "p99_ms":        pct(0.99),
        "min_ms":        min(times) * 1000               if times else None,
        "max_ms":        max(times) * 1000               if times else None,
        "status_counts": dict(status_counts),
        "error_counts":  dict(error_counts),
        "is_breaking":   is_breaking,
    }


# ── Impresión de snapshot ─────────────────────────────────────────────────────

def print_snapshot(s, label=""):
    sep = "─" * 70
    tag = "💥 QUIEBRE" if s["is_breaking"] else "✅ ESTABLE "
    print(sep)
    if label:
        print(f"  {label}")
    print(f"  {tag}  |  👥 {s['users']:>4} usuarios  |  📦 {s['total']:>5} sesiones  |  ⏱  {s['elapsed']:.1f}s")
    print(f"  OK: {s['ok']:>5}   Errores: {s['errors']:>5}   Error rate: {s['error_rate']:.1f}%")
    print(f"  RPS carga: {s['rps_load']:.2f}  |  RPS servidor (real): {s['server_rps']:.2f}")
    if s["avg_ms"] is not None:
        def fmt(v):
            return f"{v:.0f}ms" if v is not None else "N/A"
        print(
            f"  Latencia → Avg: {fmt(s['avg_ms'])}  "
            f"Med: {fmt(s['median_ms'])}  "
            f"p90: {fmt(s['p90_ms'])}  "
            f"p95: {fmt(s['p95_ms'])}  "
            f"p99: {fmt(s['p99_ms'])}"
        )
    else:
        print("  ⚠️  Sin respuestas exitosas para calcular latencias.")
    if s["status_counts"]:
        codes = "  ".join(f"HTTP {k}: {v}" for k, v in sorted(s["status_counts"].items()))
        print(f"  Códigos HTTP → {codes}")
    if s["error_counts"]:
        errs = "  ".join(f"{k}: {v}" for k, v in s["error_counts"].items())
        print(f"  Errores      → {errs}")


# ── Reporte final ─────────────────────────────────────────────────────────────

def print_final_report(snapshots):
    stable   = [s for s in snapshots if not s["is_breaking"]]
    breaking = next((s for s in snapshots if s["is_breaking"]), None)

    print(f"\n{'═'*70}")
    print(f"  📋 RESUMEN FINAL — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  URL: {URL}")
    print(f"{'─'*70}")
    print(f"  Criterios de quiebre: error rate > {BREAK_ERROR_RATE}%  |  p95 > {BREAK_P95_MS} ms")
    print(f"{'─'*70}")

    if stable:
        last        = stable[-1]
        best_server = max(stable, key=lambda x: x["server_rps"])
        p95_str     = f"{last['p95_ms']:.0f}ms" if last["p95_ms"] else "N/A"
        print(f"  🏆 Última fase estable     : {last['users']:>4} usuarios  "
              f"error {last['error_rate']:.1f}%  p95 {p95_str}")
        print(f"  🏆 Máx RPS servidor (real) : {best_server['server_rps']:.2f} rps  "
              f"@ {best_server['users']} usuarios  ← throughput máximo del servidor")
    else:
        print("  ⚠️  El servidor no soportó ni la carga inicial.")

    if breaking:
        p95_str = f"{breaking['p95_ms']:.0f}ms" if breaking["p95_ms"] else "N/A"
        print(f"  💥 Punto de quiebre        : {breaking['users']:>4} usuarios  "
              f"error {breaking['error_rate']:.1f}%  p95 {p95_str}")
    else:
        last_users = snapshots[-1]["users"] if snapshots else 0
        print(f"  ✅ No se alcanzó el quiebre (máx probado: {last_users} usuarios)")

    print(f"{'═'*70}\n")


# ── Modo rampa ────────────────────────────────────────────────────────────────

async def run_ramp(max_users, ramp_steps, step_duration, sessions_per_user):
    step_size = max(1, max_users // ramp_steps)
    print(f"\n{'═'*70}")
    print(f"  🔥 MODO RAMPA: {ramp_steps} pasos — hasta {max_users} usuarios simultáneos")
    print(f"  Modelo: {sessions_per_user} sesión(es) por usuario (HTML → assets CSS/JS → think time 1–3s)")
    print(f"  Quiebre si: error rate > {BREAK_ERROR_RATE}%  ó  p95 > {BREAK_P95_MS} ms")
    print(f"{'═'*70}\n")

    snapshots = []

    for step in range(ramp_steps):
        concurrent = min(step_size * (step + 1), max_users)
        connector   = aiohttp.TCPConnector(ssl=SSL_VERIFY, limit=concurrent * 15)
        start_barrier = asyncio.Event()
        stop_event    = asyncio.Event()
        bucket        = []

        tasks = [
            asyncio.create_task(
                user_worker(i, connector, start_barrier, stop_event, bucket, sessions_per_user)
            )
            for i in range(concurrent)
        ]

        total_sesiones = concurrent * sessions_per_user
        print(f"▶  Paso {step+1}/{ramp_steps}: {concurrent} usuarios × {sessions_per_user} sesión(es) = {total_sesiones} sesiones ...", flush=True)
        step_start = time.perf_counter()
        start_barrier.set()

        # Espera a que todos completen su única sesión
        await asyncio.gather(*tasks, return_exceptions=True)
        elapsed = time.perf_counter() - step_start
        await connector.close()

        snap = analyze_snapshot(bucket, concurrent, elapsed)
        snapshots.append(snap)
        tag = "QUIEBRE" if snap["is_breaking"] else "OK"
        print(f"   {tag}  {snap['ok']}/{total_sesiones} OK  error {snap['error_rate']:.1f}%  {elapsed:.1f}s")
        print_snapshot(snap, label=f"Paso {step+1} — {concurrent} usuarios × {sessions_per_user} sesión(es)")

        if snap["is_breaking"]:
            print(f"\n  ⛔  Quiebre detectado en {concurrent} usuarios. Prueba finalizada.")
            break

        await asyncio.sleep(2)  # pausa breve entre pasos

    print_final_report(snapshots)


# ── Modo fijo ─────────────────────────────────────────────────────────────────

async def run_fixed(users, duration, sessions_per_user):
    total_sesiones = users * sessions_per_user
    print(f"\n{'═'*70}")
    print(f"  🔥 MODO FIJO: {users} usuarios × {sessions_per_user} sesión(es) = {total_sesiones} sesiones totales")
    print(f"  Modelo: {sessions_per_user} sesión(es) por usuario (HTML → assets CSS/JS → think time 1–3s)")
    print(f"  Quiebre si: error rate > {BREAK_ERROR_RATE}%  ó  p95 > {BREAK_P95_MS} ms")
    print(f"{'═'*70}\n")

    connector     = aiohttp.TCPConnector(ssl=False, limit=users * 15)
    start_barrier = asyncio.Event()
    stop_event    = asyncio.Event()
    bucket        = []

    tasks = [
        asyncio.create_task(user_worker(i, connector, start_barrier, stop_event, bucket, sessions_per_user))
        for i in range(users)
    ]

    print(f"  Lanzando {users} usuarios simultáneos ({total_sesiones} sesiones en total)...")
    start_time = time.perf_counter()
    start_barrier.set()

    await asyncio.gather(*tasks, return_exceptions=True)
    await connector.close()

    elapsed    = time.perf_counter() - start_time
    final_snap = analyze_snapshot(bucket, users, elapsed)
    print_snapshot(final_snap, label=f"Resultado — {users} usuarios × {sessions_per_user} sesión(es)")
    print_final_report([final_snap])


# ── Entrada ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Stress test con usuarios reales para mapalab")
    parser.add_argument("--env", choices=["local", "staging", "production"], default="local",
                        help="Entorno objetivo (default: local)")
    parser.add_argument("--url", type=str, default="",
                        help="URL custom (sobreescribe --env)")
    parser.add_argument("--mode", choices=["fixed", "ramp"], default="ramp",
                        help="fixed: N usuarios fijos por T segundos  |  ramp: incremento gradual (default: ramp)")
    parser.add_argument("--users", type=int, default=100,
                        help="Máximo de usuarios concurrentes (default: 100)")
    parser.add_argument("--duration", type=int, default=60,
                        help="Duración en segundos para modo fixed (default: 60)")
    parser.add_argument("--ramp-steps", type=int, default=5,
                        help="Pasos de incremento en modo ramp (default: 5)")
    parser.add_argument("--step-duration", type=int, default=20,
                        help="Segundos por paso en modo ramp (default: 20)")
    parser.add_argument("--sessions", type=int, default=1,
                        help="Número de sesiones que realiza cada usuario (default: 1)")
    args = parser.parse_args()

    configure_target(args.env, args.url)

    print(f"\n  Iniciando prueba: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Entorno: {args.env}  |  SSL verify: {SSL_VERIFY}")
    print(f"  Target: {URL}")

    if args.mode == "ramp":
        asyncio.run(run_ramp(args.users, args.ramp_steps, args.step_duration, args.sessions))
    else:
        asyncio.run(run_fixed(args.users, args.duration, args.sessions))


if __name__ == "__main__":
    main()
