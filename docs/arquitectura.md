# Arquitectura

## Diagrama de infraestructura

```mermaid
architecture-beta
    group internet(cloud)[Internet]
        service user(internet)[Usuario] in internet
        service dns(internet)[DNS] in internet

    group gcp(cloud)[GCP]
        group vm_mapa(server)[VM MapaLab]
            service nginx(server)[Nginx] in vm_mapa
            service frontend(disk)[Frontend] in vm_mapa
            service backend(server)[Backend] in vm_mapa

        group vm_data(server)[VM DataEngine]
            service pg_primary(database)[PostgreSQL] in vm_data
            service pg_replica(database)[Replica] in vm_data
            service pgbackup(disk)[Backup] in vm_data

        group vm_geo(server)[VM GeoServer]
            service geoserver(server)[GeoServer] in vm_geo

        service storage(disk)[Storage] in gcp

    user:R --> L:dns
    dns:R --> L:nginx
    nginx:R --> L:frontend
    nginx:B --> T:backend
    nginx:R --> L:geoserver
    backend:R --> L:pg_replica
    geoserver:B --> T:pg_primary
    pg_primary:R --> L:pg_replica
    pg_primary:B --> T:pgbackup
    pgbackup:R --> L:storage
```

[Diagrama de infraestructura](https://mermaid.live/edit#pako:eNqNU01v2zAM_SuGTjbQAEOPPuyQZisGpEXXbDvMLgrFZhShsSTQUrGh6H-fZH1Y6RK0PumR7z2SEv1COtkDqQnFbs81dNogLLagaSsK-zGURhVcaEABuuwO0vRV8y3gB09y3wj4zDsojD2UkV81P0dDkcsHa5Fc_hf1Ysw0q9vNG37eC-tUbOP66i7rwKefh8eBKlo6a8Cq-XVT3Fi8ptuMmtcWjIs_iX7r0FQ9GJ0W7VDa5kRf9nx8qpqvAb4v3NLuyelivaXHx8ITM_VUH820sviLax3OjKXYo0I-UPxbOu2WjlA1d3LUDGHzfR0LutxZAwR14B3NDO595CNqN6lR4YKWEziWnZiSgcyHvAa5mdCZGS3ds5NoVoRSlpJXispRS6QMQncbjyaNXa8ocKtc3xeLxediXdsV9VF7SMFpd3x4OqZE3I88t5xyP-qwAqdkaSCfDMyUnp8k_BCRnrznV_eMGZ81ySizi3-8SPAoOYTLIxeEIe9JrdHABRkAB-ogeXG6lug9DNCS2h572FFz0C1pxauVKSp-SzlEpX19tif1jh5Gi4yy6wErThnSIUXR3gPglTRCk_ry0-XrP-CujVI)

## Diagrama de flujo de red

```mermaid
graph TB
    %% --- EXTERNOS ---
    USER["Ciudadano"]
    GTM["GTM & Analytics"]
    GITHUB{{GitHub<br>CI/CD}}

    %% --- ENTORNO TESTING (GCP) ---
    subgraph GCP["GCP"]
        TESTING_NODE["mapalab-iieg.app<br>(Testing)"]
    end

    %% --- ENTORNO PRINCIPAL (PRODUCCIÓN) ---
    DOM_MAIN["iieg.jalisco.gob.mx"]
    
    %% Agrupación del Servidor MapaLab
    subgraph S_MAPA["Servidor MapaLab"]
        FE["Frontend"]
        BE["Backend"]
    end
    
    GEO["GeoServer"]
    DE["DataEngine"]
    ACERVO["Acervo"]
    HUACHICOL["Huachicol"]

    %% --- FLUJOS DE DESPLIEGUE (GitHub) ---
    GITHUB ==>|"CI/CD"| TESTING_NODE
    GITHUB ==>|"CI"| S_MAPA

    %% --- ACCESOS DEL USUARIO Y REDIRECCIONAMIENTO ---
    USER -->|"HTTPS"| TESTING_NODE
    USER -->|"HTTPS"| DOM_MAIN
    
    %% Conexión de Testing a Producción (Redireccionamiento)
    TESTING_NODE -->|"Redireccionamiento"| DOM_MAIN

    %% Tracking a GTM
    FE -.->|"Tracking"| GTM
    TESTING_NODE -.->|"Tracking"| GTM

    %% --- FLUJOS DEL ENTORNO PRINCIPAL ---
    DOM_MAIN -->|"/mapalab"| FE
    DOM_MAIN -->|"/geoserver"| GEO
    
    %% Flujo interno de la App: Frontend a Backend
    FE --> BE

    %% Conexiones a Datos y Almacenamiento (desde el Backend)
    BE -->|"SQL"| DE
    BE -->|"Metadatos"| ACERVO
    GEO -->|"SQL Espacial"| DE

    %% --- MONITOREO (Mediciones) ---
    FE -.->|"Mediciones"| HUACHICOL
    BE -.->|"Mediciones"| HUACHICOL
    DE -.->|"Mediciones"| HUACHICOL
    GEO -.->|"Mediciones"| HUACHICOL

    %% --- ESTILOS ---
    style USER fill:#f1f5f9,stroke:#64748b,color:#000
    style GTM fill:#fbbc04,stroke:#e65100,color:#000
    style GITHUB fill:#24292e,color:#fff,stroke:#fafafa
    
    %% Estilo de Testing (GCP)
    style TESTING_NODE fill:#e2e8f0,stroke:#475569,color:#000
    style GCP fill:#f8fafc,stroke:#4285f4,stroke-dasharray: 5 5,color:#000

    %% Estilos del Entorno Principal
    style DOM_MAIN fill:#e2e8f0,stroke:#475569,color:#000
    
    %% Estilos para Frontend y Backend
    style FE fill:#16a34a,color:#fff
    style BE fill:#16a34a,color:#fff
    
    style GEO fill:#ea580c,color:#fff
    style DE fill:#dc2626,color:#fff
    style ACERVO fill:#0284c7,color:#fff
    style HUACHICOL fill:#991b1b,color:#fff
```

[Diagrama de red](https://mermaid.live/edit#pako:eNqVldtum0AQhl9lRS7rA8aHIC4q-YAdK7FDjVNVratoDAumARYtS5U0idSrPkDVJ8yTdBYwsWO7UrlA7PJ__-7ODMOj4jCXKobic0g25GqxigleabYuJqbzpbmYm8svK2UaC8pjKlbK10IkrxvbXOC7mzQDHjAyDmIIKwGN3VX8xnA0t1GPd2Jl6zBw2J7d6HqGbyNIIIR1PQio34Ak-afhZGghMmHMDykZhixziRWC8BiP9qwr4KM1RADvpDgR7Mn2pbPbWd_qS_mMvPz8Q2a4sytYHxDymk-m808onftBfE-MTqdNLpZLyyZNYugqefn1m8g5274i7_I32lGbsYkeY85wb7FLmlnKm-kGOG3G0re5EVF4lBtIbgDOncRwQVU9kO2E79hRR-brQUcgwJQr0qOLWZNbazFFucVS4XNqf7giFg8i4A9ETk2mNmnp9XajR4xup62Vp7aHi_6sbl_061q3d8p4YVr7xguaYKFA7tQ-RQ0uJZX49TWGIEvycPcdyr-z_w3DxLx-jcOEMhtNKD-6biGtNERraOcNlVwCF-wHYOKXLHJAyHToJ9JxMNjZnfy4SL3-_mmlFJUki2qlPMnPpFDggxQUtbfF8kHJNfNApAJE4BAvCGkq-bF5qEw4u38gTUiCgilL6AkL66TYpyzNT14heo5gXLabGZglIjOZZ1DWghQVqS5UCLyRaaUEy2xrVYxKHS-KwglY_NZsT-dmUVIKsEQqAT6XgqJIqtBCPsSsXq-_UUcQWzAOPiWDvKzSPIllBxIP2HG2DVIGNzTOvF6vlgrO7qhxdr7WXJ3WHBYybpzJaO5wsgMWSAu0TsW0elqrfYrBVlcyHU3vejsUnLepvqU8z9ulZKcrKKp7qkcrqjQ5vlbZ-kqy3QG9235dj-r0dZdv15OdZLsiYMK7Fed0Na3lneZkGZRx9Hqu2qpA2uu2VHUHVGr4xwpcxRA8ozUlojwCOVQepeVKERsaYesy8NGlHmQh_rZW8TNiCcSfGYu2JGeZv1EMD8IUR1nigqCjALAbRNUsx2-S8iHLYqEYmqo9_wXdGB2e)

## Componentes

### VM MapaLab

| Servicio | Tecnologia | Puerto | Descripcion |
|----------|-----------|--------|-------------|
| Nginx | nginx:stable-alpine | 80, 443 | Reverse proxy, SSL termination, cache de GeoServer |
| Frontend | React 19 + Vite | — | Archivos estaticos servidos por Nginx |
| Backend | FastAPI + Gunicorn | 8000 | API REST, 4 workers Uvicorn |

### VM DataEngine

| Servicio | Tecnologia | Puerto | Descripcion |
|----------|-----------|--------|-------------|
| PostgreSQL Primary | PostgreSQL 18 + PostGIS 3.6 | 5432 | Base de datos principal, SSL + SCRAM-SHA-256 |
| PostgreSQL Replica | PostgreSQL 18 | 5433 | Replica de lectura |
| pg-backup | pg_dump | — | Backups automaticos a Object Storage |

### VM GeoServer

| Servicio | Tecnologia | Puerto | Descripcion |
|----------|-----------|--------|-------------|
| GeoServer | 2.27.0 Kartoza / Tomcat | 8080 | Servidor de mapas OGC (WMS, WFS, WCS) |

## Docker

### Servicios containerizados (VM MapaLab)

```mermaid
graph TB
    subgraph docker["Docker Compose — mapalab-network"]
        nginx["Nginx Container"]
        backend["Backend Container<br/>Gunicorn + Uvicorn"]
    end

    dist["frontend/dist/<br/>Static files"] -.->|"volume :ro"| nginx
    certs["nginx/certs/<br/>SSL certificates"] -.->|"volume :ro"| nginx

    nginx -->|"proxy_pass"| backend

    style docker fill:#0db7ed,stroke:#384d54,color:#fff
    style dist fill:#34a853,color:#fff
    style certs fill:#fbbc04,color:#000
```

[Diagrama de servicios containerizados](https://mermaid.live/edit#pako:eNqFks9KAzEQxl8lpEdbu9gWJUgPreBFvKgXjUh2M2lDd5NlkvUPVfAhfEKfxNnsttKDmEvmm3y_j0zIlhdeAxd8hapes9uFdIxWaPKuoX2xAXyQ_CIVbOmr2gdg359frFK1KlU-chBfPG4kf-zgdrmVda-EXbc7US4q6wAPPLmiSKfJteiqX995juP5ZeNs4dGxI3b3nKo9TmbpulLbECnCILHUHrd6nPibqKItmLElBCLZ6Hg0f5f82ZdNBUygl_y9u2iXVADGQFGpNU6qD7q5SofW2ELF_8O6uCTYKNlq9K9vT7UKobX1g--MIb6V0L90e9tSDDKdn4Iehoh-A2IwOZvq2XRY-NKjGBhjDkAauMcmU3U2m_zhSwP1RpPnRbYPzLKMD-kHWM1FxAaGvAKsVCv5to2QPK6hAskFlRqMasoouXQfhNXK3Xtf7Uj0zWrNhVFlINXUmh7swir6TdW-izQ84NI3LnJxkp18_ADLUNiF)

### Servicios externos (no containerizados)

- PostgreSQL (VM DataEngine)
- GeoServer (VM GeoServer)
