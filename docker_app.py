"""Entrada del contenedor: la API de FastAPI + la SPA ya compilada (dist/).

Nombre distinto a `app.py`/`main.py`/`server.py` para que Vercel no lo tome
como entrypoint de la función serverless (allí se usa `api/index.py`).
El montaje de `dist/` va DESPUÉS de las rutas de la API: Starlette recorre
las rutas en orden, así que `/api/*` sigue respondiendo la API.
"""

from fastapi.staticfiles import StaticFiles

from api.index import app

app.mount("/", StaticFiles(directory="dist", html=True), name="spa")
