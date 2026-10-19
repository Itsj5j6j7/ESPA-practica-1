# Un solo contenedor: la etapa `web` compila la SPA con Node/pnpm y la etapa
# final sirve API + dist/ con uvicorn en el puerto 8000.
FROM node:22-alpine AS web
WORKDIR /w
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN pnpm build

FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api ./api
COPY docker_app.py .
COPY --from=web /w/dist ./dist
EXPOSE 8000
CMD ["uvicorn", "docker_app:app", "--host", "0.0.0.0", "--port", "8000"]
