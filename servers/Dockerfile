# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

WORKDIR /app

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore

COPY backend/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY backend/app /app/app
COPY servers /app/servers

EXPOSE 8000

FROM base AS development
CMD ["uvicorn", "servers.mapalab:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS production
ENV MCP_WORKERS=2
CMD sh -c "gunicorn servers.mapalab:app --workers ${MCP_WORKERS} --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"
