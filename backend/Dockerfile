# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

WORKDIR /app

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY . .

EXPOSE 8000

FROM base AS development
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS production
ENV GUNICORN_WORKERS=8
CMD sh -c "gunicorn app.server:app --workers ${GUNICORN_WORKERS} --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"
