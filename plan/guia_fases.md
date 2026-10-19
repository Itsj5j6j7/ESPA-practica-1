# Guía de fases · pedirle una fase a Claude + pasos manuales (Vercel, Clerk, AWS)

Compañero de `plan.md` (reparto, ramas y commits). Aquí: **qué decirle a Claude** y **qué hacéis vosotros a mano** en cada servicio.

## Cómo pedírselo a Claude

Abrid Claude Code **en la raíz del repo** (`ESPA-practica-1/`) y pegad:

```
Lee plan/plan.md y plan/guia_fases.md (y el README). Soy la Persona <A|B|C>. Parte de la rama `dev` actualizada.
Haz la Fase <N>, solo mis tareas. Trabaja en la rama indicada en el plan.
No hagas commits ni push: dime el mensaje de cada commit en el orden del plan.
No toques secciones del README que no sean mías. Nada fuera del alcance del enunciado.
Si necesitas que yo haga algo en Vercel/Clerk/AWS, dame los pasos y espera mi salida.
```

Reglas que Claude debe respetar (están en el prompt, pero recordadlas):

- Usad **pnpm** para todo lo de Node (nada de npm ni yarn: el lockfile es `pnpm-lock.yaml`).
- **Nunca** pegar valores de claves en el chat. Decidle "la variable `X` ya está en mi `.env`", no el valor.
- Claude no entra en vuestras consolas web: os da los pasos y vosotros pegáis la salida (sin secretos).
- Los commits los hacéis vosotros con vuestra identidad (así queda la autoría correcta).
- Antes de cada push: `git diff --cached | grep -nEi 'sk-|sk_(test|live)_|BEGIN .*PRIVATE KEY|AKIA'` sin salida.

Prompts cortos listos (cambiad la letra):

| Fase | Prompt |
| --- | --- |
| 0 | `Persona C, Fase 0: crea .gitignore, .env.example y el esqueleto del README con las 12 secciones del enunciado y su responsable.` |
| 1 | `Persona A, Fase 1: endpoint /api/generar y /api/health según el contrato del plan.` · `Persona C, Fase 1: tests de backend con el proveedor simulado (4 casos como máximo).` |
| 2 | `Persona B, Fase 2: SPA React+TS+Tailwind (el scaffold ya existe) con un formulario, carga y error, contra el contrato.` · `Persona A, Fase 2: fija versiones de dependencias y completa la tabla de variables.` |
| 3 | `Persona B, Fase 3: vercel.json y build para un único proyecto. Dame los comandos de CLI a ejecutar.` |
| 4 | `Persona A, Fase 4: valida el token de Clerk en FastAPI como dependencia y añade los tests de rechazo.` · `Persona B, Fase 4: Clerk en la SPA y envío del Bearer.` |
| 5 | `Persona A, Fase 5: Dockerfile multi-stage, .dockerignore y docker_app.py.` |
| 6 | `Persona C, Fase 6: dame el procedimiento de despliegue en EC2 con mi tag y revisa mi README de AWS.` |
| 7 | `Persona C, Fase 7: revisa el README contra el apartado 7 y el checklist del apartado 10 del enunciado y dime qué falta.` |

---

## Fase 0 · Preparación

> **Hecho en `dev` por el integrador:** `.gitignore`, `.env.example`, proyecto Vite + React + TS + Tailwind 4, `@clerk/react`, `requirements.txt` y el README con las 12 secciones. Lo que sigue en «Lo que hace Claude» es lo que contiene; no lo repitáis.

### Lo que hace Claude (ya hecho)
- `.gitignore`: `.env`, `.env.*` (menos `.env.example`), `node_modules/`, `dist/`, `__pycache__/`, `.venv/`, `.vercel/`, `*.pem`, `evidencias/privado/`.
- `.env.example` con los nombres de la tabla del plan y valores ficticios.
- Esqueleto de README con las 12 secciones y un `<!-- responsable: X -->` en cada una.

### Lo que hacéis vosotros
1. **GitHub (dueño del repo):** Settings → Collaborators → invitar a A y B. Cada uno clona por SSH y configura su identidad (`git config user.name/user.email`).
2. **Proveedor de IA (OpenRouter):** https://openrouter.ai → *Keys* → crear una clave **solo para la práctica** con *credit limit* bajo. Elegir un modelo barato (`AI_MODEL=proveedor/modelo`; comprobad el nombre exacto en la lista de modelos de OpenRouter). Guardar en `.env` local (no en el chat). Prueba: `curl https://openrouter.ai/api/v1/chat/completions -H "Authorization: Bearer $AI_API_KEY" -H 'content-type: application/json' -d '{"model":"'$AI_MODEL'","messages":[{"role":"user","content":"hola"}]}'`.
3. **Vercel (solo el dueño de la cuenta):** `pnpm add -g vercel`, comprobar `vercel --version` (≥ 48.1.8 para FastAPI) y `vercel login`.
4. **Clerk:** https://dashboard.clerk.com → Create application → activar *Email* → quedaros con la instancia **Development**. Anotad (en `.env`, no en Git) la *Publishable key* (`pk_test_…`) y la *Secret key* (`sk_test_…`) desde *API Keys*.
5. **AWS Academy:** entrar al Learner Lab → *Start Lab* → anotar la región permitida y la duración de sesión (guías G01/G02).
6. Decidir quién es **dueño del proyecto Vercel** y quién el de **la EC2** (Learner Lab es por cuenta de alumno).

**Comprobación:** `git clone`, `pnpm install` y `pnpm build` en limpio funcionan; `git log -p | grep -i 'sk-'` sin resultados; `docker run --rm hello-world` funciona.

---

## Fase 1 · Backend mínimo

### Lo que hace Claude
- Cliente de IA: `OpenAI(api_key=AI_API_KEY, base_url="https://openrouter.ai/api/v1", timeout=20)` y `chat.completions.create(model=AI_MODEL, ...)`.
- `api/index.py`: `app = FastAPI()`, `GET /api/health`, `POST /api/generar` (Pydantic: `texto` 1–2000), función `llamar_ia(texto)` aislada con timeout (~20 s), `AI_API_KEY`/`AI_MODEL` desde entorno, errores → 502/504 con mensaje genérico, sin trazas ni claves en logs.
- `requirements.txt` (ya existe en `dev` sin versiones, con fastapi, uvicorn, openai, clerk-backend-api, pytest y httpx; añadid `python-dotenv` si lo usáis. Pydantic viene con FastAPI).
- Persona C: `api/test_api.py` (o `tests/`) con 3 casos: ok (mock), entrada inválida, fallo del proveedor.

### Comprobar vosotros (local)
```bash
python -m venv .venv && source .venv/bin/activate   # en fish: source .venv/bin/activate.fish
pip install -r requirements.txt
cp .env.example .env     # rellenar AI_API_KEY a mano
uvicorn api.index:app --reload --port 8000
curl -s localhost:8000/api/health
curl -s -X POST localhost:8000/api/generar -H 'content-type: application/json' -d '{"texto":"Texto de prueba largo suficiente para resumir."}'
pytest -q
```
Una sola llamada real, con texto de prueba. Probad también clave inválida → 502 limpio.

---

## Fase 2 · Frontend mínimo (+ EC2 base en paralelo)

### Lo que hace Claude (Persona B)
- El proyecto Vite + React + TS + Tailwind ya existe (`src/App.tsx` es un esqueleto con Tailwind funcionando); **un** `App.tsx` con textarea, botón, estado de carga, error legible y resultado.
- `vite.config.ts` con proxy `/api` → `http://localhost:8000` en desarrollo.
- Sin react-router, sin store, sin librerías de UI (alcance). Estado con `useState`.

### Persona A (dependencias reproducibles)
- Fijar versiones en `requirements.txt` (`pip freeze` de lo que ya funciona, solo los paquetes directos) y registrar en README §4 las versiones de Python/Node.
- Completar la tabla de variables (§5): nombre, finalidad, pública/secreta, dónde, compilación o ejecución.
- No hay CORS: el proxy de Vite lo evita en local y en Vercel/Docker el navegador usa un único origen.

### Persona C — EC2 base (a mano, AWS Academy Learner Lab)
1. Learner Lab → *Start Lab* → esperar punto verde → *AWS* (consola).
2. EC2 → *Launch instance*:
   - Nombre `espa-p1`; AMI **Ubuntu Server LTS**; tipo `t3.micro` (o `t2.micro`; si Vite no compila por memoria, ver abajo).
   - Par de claves **propio** (como G03): descargar `.pem`, `chmod 400 ~/.ssh/espa-p1.pem`. **Nunca** al repo.
   - Red: VPC por defecto, *Auto-assign public IP* activado.
   - Security Group nuevo `espa-p1-sg`, reglas de entrada: **SSH 22/TCP** desde la IP de cada integrante `/32` (una regla por persona; *My IP* en cada caso). **De momento nada más.**
   - Almacenamiento 8–16 GB gp3.
3. Conectar: `ssh -i ~/.ssh/espa-p1.pem ubuntu@IP_PUBLICA`.
4. Que A y B puedan entrar con **su** clave (sin compartir `.pem`): cada uno os pasa su clave **pública** y la añadís a `~/.ssh/authorized_keys` en la instancia.
5. Instalar Docker (G17 §5):
   ```bash
   sudo apt-get update && sudo apt-get install -y docker.io git
   sudo usermod -aG docker $USER      # cerrar sesión y volver a entrar
   docker run --rm hello-world && docker --version
   ```
6. Si luego `docker build` se queda sin memoria, swap de 2 GB:
   ```bash
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   ```
7. Anotad en el README (sección 9): región, SO, tipo, ID de instancia (recortado), reglas del SG.

---

## Fase 3 · Primer despliegue en Vercel

### Lo que hace Claude (Persona B)
- `vercel.json` con *rewrite* `/api/(.*)` → `/api/index.py` (como la P0) y, si hace falta, `functions` → `"api/index.py": {"maxDuration": 30}`.
- Comprobar que `package.json` tiene `build` (`tsc -b && vite build`) y que Vercel detecta Vite con salida `dist`.
- Documentar la organización del proyecto único en README sección 6.

### Pasos manuales (Vercel) — repartidos como en el plan

**Persona B — enlazar y desplegar**
```bash
vercel link                 # crear proyecto nuevo "espa-practica-1" en la raíz del repo
vercel deploy               # despliegue Preview → anota la URL
vercel deploy --prod        # publicar el final
```
Dashboard: Project → Settings → *Build & Output*: Framework **Vite**, Output **dist**. Tras `vercel link` queda `.vercel/` (ya ignorado).

**Persona C — variables de entorno** (sin dejar el valor en el historial: el comando te lo pide por teclado)
```bash
vercel env add AI_API_KEY production      # repetir con "preview"
vercel env add AI_MODEL production
vercel env ls                              # muestra nombres y entornos, NO valores
```
Marcad las secretas como *Sensitive* en el dashboard (o `--sensitive` si vuestra CLI lo ofrece: `vercel env add --help`).
Cambiar una variable **no** afecta a despliegues ya hechos: hay que redesplegar.

**Persona A — diagnóstico**
```bash
vercel ls                                  # despliegues del proyecto
vercel inspect <URL_DEL_DESPLIEGUE>        # runtime, funciones, rutas
vercel logs <URL_DEL_DESPLIEGUE>           # logs de ejecución
```
Provocad una incidencia real y diagnosticadla (p. ej. despliegue sin `AI_API_KEY` → 500/502, localizarlo en logs, corregir, redesplegar). Va a la sección 11 del README.

### Comprobar
- Navegador: `https://<proyecto>.vercel.app` → SPA → resumen real.
- `curl https://<proyecto>.vercel.app/api/health`.
- Captura del proyecto en Vercel con **un único proyecto** y el despliegue correcto; captura de variables (nombres/entornos) sin valores.
- README: tabla "comando · finalidad · resultado", URL y tag.

**Gotcha:** si la función tarda mucho en el primer arranque (frío), el timeout lo da el proveedor, no Vercel; ajustad `maxDuration` y el timeout del cliente de IA.

---

## Fase 4 · Clerk y redespliegue

> Verificad contra la doc vigente al implementar: `@clerk/react` (frontend, v6) y `clerk-backend-api` (Python, `authenticate_request` + `AuthenticateRequestOptions`). Nombres exactos podrían variar.

### Lo que hace Claude
**Persona B (frontend)**
- `@clerk/react` ya está instalado; en `main.tsx`: envolver `<App />` en `<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>`.
- `App.tsx`: `<Show when="signed-out">` con `<SignInButton mode="modal" />` (el modal evita configurar páginas hospedadas) y `<Show when="signed-in">` con `<UserButton />` (incluye cerrar sesión) y el formulario. (`Show`, `SignInButton`, `UserButton`, `ClerkProvider` y `useAuth` existen en la v6 instalada; `SignedIn`/`SignedOut` ya no.)
- En la llamada: obtener el token de sesión con el hook de Clerk (`const { getToken } = useAuth()`; `await getToken()`) y enviar `Authorization: Bearer <token>`. 401 → mensaje "inicia sesión".

**Persona A (backend)**
- Dependencia FastAPI que llama a `authenticate_request` con `CLERK_SECRET_KEY`, `authorized_parties` desde `CLERK_AUTHORIZED_PARTIES` y solo tokens de sesión; si no hay sesión válida → `HTTPException(401)`.
- Aplicarla **solo** a `/api/generar`; `/api/health` queda público.
- Tests: sin cabecera → 401; con verificador simulado → 200. Sin llamadas a Clerk reales en los tests.

### Pasos manuales (Clerk + Vercel) — Persona C
1. Clerk Dashboard → *Users* → *Create user* con un correo de prueba (sin datos personales).
2. *API Keys*: confirmar `pk_test_…` y `sk_test_…`. (Opcional: la *JWT public key* permite validar la firma sin red; si la usáis, añadid `CLERK_JWT_KEY` a la tabla de variables. Es pública por naturaleza, pero se configura en el servidor.)
3. Variables en Vercel:
   ```bash
   vercel env add VITE_CLERK_PUBLISHABLE_KEY production   # y preview (pública, se compila en el bundle)
   vercel env add CLERK_SECRET_KEY production             # y preview (secreta)
   vercel env add CLERK_AUTHORIZED_PARTIES production     # https://<proyecto>.vercel.app,http://localhost:5173
   ```
4. Redesplegar: `vercel deploy --prod` (la pública se compila: sin redeploy no llega al bundle).
5. Comprobar y capturar:
   - Login con el usuario de prueba → resumen OK; logout.
   - Rechazo directo (en la **URL de producción**):
     ```bash
     curl -i -X POST https://<proyecto>.vercel.app/api/generar \
       -H 'content-type: application/json' -d '{"texto":"hola"}'
     # esperado: HTTP 401 con {"detail":"No autenticado"} generado por FastAPI
     ```

**Gotcha — Deployment Protection:** en despliegues *Preview* Vercel puede interponer su propia autenticación y devolver 401/HTML antes de llegar a FastAPI. Esa evidencia **no vale**. Usad la URL de producción (pública) para demostrar el rechazo.

---

## Fase 5 · Un solo contenedor Docker

### Lo que hace Claude (Persona A)
- `docker_app.py` (raíz): importa `app` de `api.index` y monta `dist/` con `StaticFiles(directory="dist", html=True)` en `/` **después** de las rutas de la API. Nombre distinto a `app.py/main.py/server.py` para que Vercel no lo tome como entrypoint.
- `Dockerfile`:
  ```dockerfile
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
  ```
- `.dockerignore`: `.git`, `node_modules`, `dist`, `.venv`, `.env`, `.env.*` (menos `.env.example`), `.vercel`, `*.pem`, `evidencias`, `plan`.
- Solo la clave **pública** de Clerk entra como `ARG`; ningún secreto en la imagen.

### Pasos manuales (local) — Personas B y C
```bash
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY -t espa-p1:v0.5 .
docker run -d --name espa --env-file .env -p 8000:8000 espa-p1:v0.5
docker ps
docker logs --tail 50 espa
curl -s localhost:8000/api/health
# probar en navegador http://localhost:8000: login, resumen, logout
curl -i -X POST localhost:8000/api/generar -H 'content-type: application/json' -d '{"texto":"hola"}'   # 401
docker stop espa && docker start espa
docker history espa-p1:v0.5       # sin secretos
```
- `localhost:8000` debe estar en `CLERK_AUTHORIZED_PARTIES` (añadidlo al `.env`).
- `--env-file .env` inyecta **al ejecutar**; el `.env` jamás se copia a la imagen (`.dockerignore`).
- Persona C documenta en README (sección 8): construir, ejecutar, parar, reiniciar, logs, puerto y variables; a qué tag corresponde la imagen.

---

## Fase 6 · Despliegue en AWS EC2

### Pasos manuales — Persona C (lidera; A y B revisan)
1. **Learner Lab encendido** → EC2 → la instancia `espa-p1` en *running*; copiar la IP pública **nueva** (cambia si estuvo parada).
2. **Security Group** → *Inbound rules* → añadir **HTTP 80/TCP**. Origen: el necesario para demo y evaluación (IP del aula/profesor si la conocéis; si no, `0.0.0.0/0` solo para el 80, justificado en README). SSH 22 sigue limitado a las 3 IPs `/32`. **No** abrir 2375/2376 ni otros puertos.
3. Obtener la versión exacta del repo en la instancia:
   ```bash
   ssh -i ~/.ssh/espa-p1.pem ubuntu@IP_PUBLICA
   git clone https://github.com/Itsj5j6j7/ESPA-practica-1.git && cd ESPA-practica-1
   git checkout v0.5-docker        # o v1.0-aws si ya existe
   ```
4. Archivo de variables **privado** (con `nano`, no con `echo` ni en el historial):
   ```bash
   nano ~/espa.env       # AI_API_KEY, AI_MODEL, CLERK_SECRET_KEY, CLERK_AUTHORIZED_PARTIES=http://IP_PUBLICA
   chmod 600 ~/espa.env
   ```
   Fuera del repo clonado, nunca en Git.
5. Construir y ejecutar **un** contenedor:
   ```bash
   docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXX -t espa-p1:v1.0 .
   docker run -d --name espa --restart unless-stopped --env-file ~/espa.env -p 80:8000 espa-p1:v1.0
   ```
   (Alternativa si no compila en EC2: `docker save espa-p1:v1.0 | gzip | ssh -i … ubuntu@IP 'gunzip | docker load'`.)
6. Verificar:
   ```bash
   docker ps
   docker logs --tail 50 espa
   docker inspect espa --format '{{.State.Status}} {{.HostConfig.RestartPolicy.Name}}'
   ```
   Desde **fuera** (tu PC): `http://IP_PUBLICA` → SPA, login, resumen real.
7. Rechazo sin token (Persona A):
   ```bash
   curl -i -X POST http://IP_PUBLICA/api/generar -H 'content-type: application/json' -d '{"texto":"hola"}'   # 401
   ```
8. Reinicio (Persona B): `docker restart espa` → repetir comprobación.
9. Evidencias: EC2 (nombre, SO, estado), SG (protocolo, puertos, orígenes), `docker ps`, navegador con la app. Sin Account ID, ARN ni claves.

### Actualizar a una versión nueva (documentadlo en README)
```bash
cd ~/ESPA-practica-1 && git fetch --tags && git checkout <nuevo_tag>
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXX -t espa-p1:<nuevo_tag> .
docker stop espa && docker rm espa
docker run -d --name espa --restart unless-stopped --env-file ~/espa.env -p 80:8000 espa-p1:<nuevo_tag>
```

### Si la IP cambia
Actualizar `CLERK_AUTHORIZED_PARTIES` en `~/espa.env`, `docker restart espa` y la URL en README y en la entrega.

### Limitación HTTP (poned esto en README)
EC2 sirve por HTTP sin cifrado: el token de sesión viaja en claro. Es un entorno docente con cuentas y datos de prueba. Si Clerk dev no funciona con origen HTTP, documentad el error literal y consultad al profesorado; **no se elimina la autenticación**.

### Al terminar
Tras la defensa: *Terminate* de la instancia, borrar volúmenes huérfanos, SG propio y par de claves; *End Lab*. Revocar las claves de IA y Clerk.

---

## Fase 7 · Cierre

### Lo que hace Claude
- Persona C: `Revisa el README contra el apartado 7 y el checklist del 10 y dime qué falta` — Claude lista huecos, no inventa contenido.
- Persona B: guion de demo de 5 minutos (Vercel → 401 → EC2 → logs → reinicio) y diagrama Mermaid de arquitectura.
- Persona A: pasada de seguridad: `git log -p --all | grep -nEi 'sk-|sk_(test|live)_|BEGIN .*PRIVATE KEY|AKIA'`, `docker history`, permisos del archivo de entorno, variables públicas frente a privadas.

### Vosotros
1. Tags finales publicados y apuntando a commits distintos: `git ls-remote --tags origin`.
2. Cada uno ejecuta una operación del entorno que **no** montó (A: `vercel logs`; B: SSH + `docker logs`; C: explicar la dependencia de Clerk en FastAPI).
3. Entrega: repo, tag + commit final, URL Vercel, URL EC2, README, presentación.
4. Dejar EC2 y Vercel disponibles hasta que el profesorado diga; después limpiar recursos.

## Atajo: qué carpeta/archivo toca cada fase

| Fase | Archivos principales |
| --- | --- |
| 1 | `api/index.py`, `requirements.txt`, `api/test_api.py` |
| 2 | `src/App.tsx`, `src/main.tsx`, `vite.config.ts` (Tailwind 4 no usa `tailwind.config.js`) |
| 3 | `vercel.json`, README §6 |
| 4 | `api/index.py` (dependencia auth), `src/main.tsx`, `src/App.tsx`, `.env.example` |
| 5 | `Dockerfile`, `.dockerignore`, `docker_app.py`, README §8 |
| 6 | README §9 y §10 (no hay código nuevo) |
| 7 | README completo, `evidencias/`, presentación |
