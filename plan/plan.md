# Plan de trabajo · Práctica 1 (3 personas, por fases, ramas y commits)

Repo: `github.com/Itsj5j6j7/ESPA-practica-1` (público). Enunciado: `Practica_UD1_Explotacion_Despliegue_IA.md`.
Para pedirle una fase a Claude y ver los pasos manuales en Vercel/Clerk/AWS: `guia_fases.md`.

## Estado actual (2026-10-19)

- **Fase 0 hecha por Javier (B, integrador y dueño de Vercel)**: en `dev` ya están `.gitignore`, `.env.example`, scaffold Vite + React + TS, Tailwind 4, `@clerk/react` y `requirements.txt` (sin versiones fijadas), más el README con las 12 secciones. Todo eso se **da por hecho**: no lo rehagáis.
- Empezad cada tarea con `git checkout dev && git pull && pnpm install`.
- La carpeta `plan/` del repo (copia de este plan y de la guía) la sube Javier; es lo que lee Claude.

## 0. Decisiones por defecto (cambiadlas en la Fase 0 si no os cuadran)

| Tema | Decisión | Por qué |
| --- | --- | --- |
| Miniapp | **Resumidor**: texto → resumen breve | La más pequeña de las permitidas |
| Frontend | **React 19** + TypeScript + Tailwind 4 (Vite 8, **pnpm**) | Decisión del equipo; ya está creado en `dev` |
| Backend | FastAPI en `api/index.py`, `requirements.txt` en la raíz | Mismo esquema que funcionó en Vercel en la P0 |
| Proveedor IA | **OpenRouter** (API compatible con OpenAI; SDK `openai` con `base_url=https://openrouter.ai/api/v1`; clave `AI_API_KEY`, modelo `AI_MODEL` con formato `proveedor/modelo`) | El dueño de Vercel ya tiene la clave; el modelo va en variable, no en código |
| Auth | Clerk, instancia de **desarrollo**; `@clerk/react` (v6; `@clerk/clerk-react` está deprecado) + `clerk-backend-api` | Lo exige el enunciado; sin dominio propio |
| Contenedor | Multi-stage: Node compila la SPA, Python sirve API + `dist/` en un solo proceso | 1 contenedor, sin Compose |
| EC2 | Ubuntu LTS (como las guías G01–G17), puerto 80 → 8000 del contenedor | Coherente con las guías de AWS Academy |
| Commits | Conventional Commits, **español** desde la Fase 5 (los anteriores están en inglés), imperativo, sin punto final | Convención del repo; el enunciado solo pide "significativos". Los mensajes de ejemplo de las tablas de fases están en inglés: se redactan en español |

### Contrato de la API (fijo desde la Fase 0; permite trabajar en paralelo)

```
GET  /api/health   -> 200 {"status": "ok"}                       (público siempre)
POST /api/generar  body {"texto": str, 1..2000 chars}
                   -> 200 {"resumen": str}
                   -> 422 validación (formato por defecto de FastAPI)
                   -> 502 {"detail": "El servicio de IA no está disponible"}   error del proveedor
                   -> 504 {"detail": "El servicio de IA tardó demasiado"}      timeout
                   -> 401 {"detail": "No autenticado"}      (solo desde la Fase 4)
Cabecera de auth (Fase 4): Authorization: Bearer <token de sesión de Clerk>
La llamada al proveedor vive en UNA función (llamar_ia) para poder simularla en los tests.
```

### Variables de entorno (nombres fijos)

| Variable | Pública/Secreta | Cuándo | Dónde |
| --- | --- | --- | --- |
| `AI_API_KEY` | secreta | ejecución | `.env` local · Vercel env · archivo privado en EC2 |
| `AI_MODEL` | no secreta | ejecución | igual |
| `CLERK_SECRET_KEY` | secreta | ejecución | igual |
| `CLERK_AUTHORIZED_PARTIES` | no secreta | ejecución | orígenes separados por coma (localhost, Vercel, `http://IP_EC2`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | pública | **compilación** | `.env` local · Vercel env · `--build-arg` en Docker |

## 1. Roles (cada uno toca código, operaciones cloud y documentación)

| | Persona | Rol | Fases donde lidera |
| --- | --- | --- | --- |
| **A** | **Pablo** | Tests y seguridad | F1 (tests), F4 (tests), F5 (Dockerfile) |
| **B** | **Javier** (integrador, dueño de Vercel y de la clave de OpenRouter) | Frontend y Vercel | F2, F3, F4 (frontend) |
| **C** | **Nicolas** | Backend, infra y AWS | F1 (backend), F2 (EC2 base), F4 (backend), F6, F7 |

**Documentación: la hacemos entre todos.** Cada uno escribe en el README lo que hace, en la misma rama que el cambio, en la sección que corresponda (no hay dueños de sección). La sección 1 (Identificación) y la tabla de problemas (§11) las rellena cada uno con lo suyo.

**Regla de comprensión:** el profesorado puede preguntar a cualquiera por cualquier parte. En la Fase 7 cada persona ejecuta una vez, delante de las otras, una operación de cada entorno que *no* construyó (ver F7).

## 2. Flujo Git (ramas y commits)

- `main` = solo hitos desplegables (lleva los tags). `dev` = integración. **Nadie hace push directo a `main` ni a `dev`.**
- Rama por tarea, **creada desde `dev`**: `<tipo>/<persona>-<tema>`, p. ej. `feat/c-generar-endpoint`, `docs/c-ec2-setup`. Subidla con `git push -u origin <rama>` y avisad a Javier.
- **Javier (integrador) mergea cada rama a `dev`** con `git merge --no-ff` (merge commit), sin PR obligatorio. **Nunca squash**: borra la autoría de cada commit y la rúbrica pide aportación individual identificable. Antes de avisar, rebasad vuestra rama sobre `dev` si ha avanzado.
- Al cerrar un hito, Javier mergea `dev` → `main` (`--no-ff`) y quien indique la fase crea el tag sobre ese commit.
- 2–4 commits por rama, cada uno coherente y que deje el repo funcionando.
- Cada uno con su identidad: `git config user.name "..."` y `git config user.email "..."` (el email de su cuenta de GitHub). Si hacéis pareja: `Co-authored-by: Nombre <email>` en el cuerpo del commit.
- **Tags anotados** sobre el commit de `main` que cierra cada hito (no todos sobre el último commit):
  `git tag -a v0.1-backend -m "backend minimo" <sha> && git push origin v0.1-backend`
  y opcional `gh release create v0.1-backend --notes "..."`.
- Antes de cada push, que salga vacío: `git diff --cached | grep -nEi 'sk-|sk_(test|live)_|BEGIN .*PRIVATE KEY|AKIA'`
- README: **el esqueleto con las 12 secciones ya está en `dev`** Todos lo completáis: cada uno documenta lo que hace en la misma rama que el cambio. Haced `git pull` de `dev` antes de editar y tocad solo las líneas de vuestra parte para evitar conflictos. Los problemas reales se anotan en la tabla de §11 en cuanto ocurren (cada uno añade su fila).
- Evidencias (capturas) en `evidencias/` con nombre `fase-N_que-demuestra.png`. Recortad Account ID, ARN, claves y valores de variables.

## 3. Fases

Leyenda: **Hecho cuando** = criterio de salida. Los mensajes de commit son orientativos; ajustad el texto, no el tipo.

### Fase 0 · Preparación (hecha en `dev` salvo lo manual de cada uno)

| Persona | Rama | Commits | Manual (fuera de Git) |
| --- | --- | --- | --- |
| **B · Javier** (integrador) | (hecho) `chore/gitignore-env-example`, `build/scaffold-vite-react`, `build/tailwind-clerk-deps`, `build/python-requirements`, `docs/readme-skeleton`, `docs/team-plan` | `.gitignore`, `.env.example`, scaffold React, dependencias, README esqueleto, `plan/` | Invitar a los otros dos como colaboradores con permiso de escritura |
| **C** | `chore/c-ai-provider` | `docs: record ai provider and environment variables` (revisar la sección 5 del README, que ya tiene la tabla base) | Crear **tu** clave de OpenRouter con límite de gasto bajo y un modelo barato (no se comparte la de Javier); `curl` real de prueba contra `https://openrouter.ai/api/v1/chat/completions` |
| **A** | `chore/a-test-tooling` | `docs: record python and pytest setup` (sección 4 del README) | Python, `.venv`, `pip install -r requirements.txt` y `pytest` funcionando en tu máquina |
| **B** | `chore/b-tooling` | `docs: record tool versions and local setup` (comprobad que la sección 4 funciona en vuestra máquina y corregidla) | `pnpm install` y `pnpm dev` funcionan; app en Clerk (instancia dev); Python. La cuenta de Vercel es de Javier |

C además: comprobar acceso a AWS Academy Learner Lab, Docker instalado en local (`docker run --rm hello-world`).
**Hecho cuando:** `dev` tiene `.gitignore`, `.env.example`, el proyecto React y el README esqueleto; los 3 pueden clonar, instalar y hacer push a ramas; ningún secreto en el historial.
**Aviso Vercel:** el plan Hobby puede no permitir añadir miembros al equipo. **El dueño del proyecto Vercel es Javier (B)**. Las operaciones de CLI de A y C se hacen en sesión conjunta con B (compartir pantalla) y se registran con `Co-authored-by`. No compartáis tokens.

### Fase 1 · Backend mínimo → `v0.1-backend` (A + C en paralelo)

| Persona | Rama | Commits |
| --- | --- | --- |
| **C** | `feat/c-generar-endpoint` | `feat: add fastapi app with health endpoint` · `feat: add generar endpoint with input validation` · `feat: handle provider errors and timeouts without leaking details` |
| **A** | `test/a-backend-tests` | `test: add generar happy path with mocked provider` · `test: cover invalid input and provider failure` |

A (Pablo) escribe los tests contra el **contrato** (monkeypatch de `llamar_ia`), sin esperar a que C (Nicolas) termine el backend.
**Hecho cuando:** `pytest` pasa (3 casos: ok, entrada inválida, fallo del proveedor); una prueba real controlada con `curl` devuelve resumen; con la clave mal puesta devuelve 502 sin trazas.
**Tag:** `v0.1-backend` lo crea **C** tras mergear ambas ramas.

### Fase 2 · Frontend mínimo → `v0.2-frontend` (B lidera; C prepara EC2 en paralelo)

| Persona | Rama | Commits |
| --- | --- | --- |
| **B** | `feat/b-spa` | `feat: add summary form and result view` · `feat: show loading and error states` · `build: proxy api calls to fastapi in dev` (el scaffold ya existe en `dev`) |
| **A** | `chore/a-reproducible-deps` | `build: pin python dependency versions` (hoy `requirements.txt` va sin versiones) · `docs: complete environment variable table with build and run timing` |
| **C** | `docs/c-ec2-setup` | `docs: record ec2 instance, os and security group rules` · `docs: record docker install check on ec2` |

C aquí no escribe código: **lanza la EC2 ya** (Learner Lab es el cuello de botella: sesiones que caducan). Pasos en `guia_fases.md` §F2-C.
**Hecho cuando:** en local, navegador → SPA → FastAPI → IA → respuesta; estados de carga y error visibles; EC2 con Docker y `hello-world`.
**Tag:** `v0.2-frontend` lo crea **B**.

### Fase 3 · Vercel (Parte 1) → `v0.3-vercel`

| Persona | Rama | Commits | Operaciones CLI que ejecuta (evidencia) |
| --- | --- | --- | --- |
| **B** | `build/b-vercel-config` | `build: configure vercel rewrites and build output` · `docs: document vercel project layout and routes` | `vercel link` · `vercel deploy` (preview) · `vercel deploy --prod` |
| **C** | `docs/c-vercel-env` | `chore: update env example for vercel` · `docs: document vercel env vars and cli usage` | `vercel env add` (production y preview) · `vercel env ls` |
| **A** | `docs/a-vercel-diagnosis` | `fix: set function max duration for ai calls` (si hace falta) · `docs: add vercel logs diagnosis and first verification` | `vercel inspect <url>` · `vercel logs <url>` |

**Hecho cuando:** URL de producción sirve la SPA y `POST /api/generar` devuelve respuesta real; hay evidencia de cada comando; variables listadas sin valores.
**Tag:** `v0.3-vercel` lo crea **C**.

### Fase 4 · Clerk y redespliegue (Parte 1) → `v0.4-auth`

| Persona | Rama | Commits |
| --- | --- | --- |
| **C** | `feat/c-clerk-backend` | `feat: validate clerk session token in fastapi dependency` |
| **A** | `test/a-clerk-tests` | `test: reject generar request without token` · `test: accept request with valid token using mocked verifier` |
| **B** | `feat/b-clerk-frontend` | `feat: add clerk provider and sign in/out controls` · `feat: send session token to generar endpoint` · `feat: show unauthenticated state instead of the form` |
| **C** | `chore/c-clerk-config` | `chore: add clerk variables to env example` · `docs: add clerk configuration and rejection evidence` |

C, A y B trabajan contra el contrato (`Authorization: Bearer`, 401). C además configura Clerk/Vercel y prueba.
**Riesgo a destapar ya (C):** que la instancia dev de Clerk funcione desde `http://IP_EC2` (HTTP). Probadlo con la SPA en cuanto exista (F5 anticipado si hace falta). Si falla, documentadlo y consultad al profesorado; **no quitéis la auth**.
**Hecho cuando:** login/logout en producción; petición autenticada OK; `curl` directo sin token a `/api/generar` → 401 de **FastAPI** (ver aviso de Deployment Protection en la guía).
**Tag:** `v0.4-auth` lo crea **B**.

### Fase 5 · Un contenedor Docker (Parte 2) → `v0.5-docker`

| Persona | Rama | Commits |
| --- | --- | --- |
| **A** | `build/a-dockerfile` | `feat: add docker entrypoint serving built spa with fastapi` · `build: add multi-stage dockerfile` · `build: add dockerignore excluding env files and node_modules` |
| **B** | `docs/b-docker-build-args` | `build: pass clerk publishable key as docker build arg` · `docs: document docker build and run commands` |
| **C** | `docs/c-docker-verification` | `docs: add local container verification with logs and restart` · `docs: record image provenance and update procedure` |

**Hecho cuando:** `docker build` sin secretos; `docker run --env-file` sirve SPA + API en `localhost:8000` con login y rechazo sin token; `docker ps/logs/stop/start` probados; `docker history` no muestra secretos.
**Tag:** `v0.5-docker` lo crea **A**.

### Fase 6 · AWS EC2 (Parte 2) → `v1.0-aws`

| Persona | Rama | Commits |
| --- | --- | --- |
| **C** | `docs/c-aws-deploy` | `docs: document ec2 deployment steps and security group` · `docs: record container status and logs on ec2` |
| **A** | `docs/a-aws-security-review` | `docs: document secrets handling and file permissions on ec2` · `docs: add unauthenticated rejection evidence on aws` |
| **B** | `docs/b-aws-update-procedure` | `docs: add update and restart procedure for ec2` · `docs: document http limitation and clerk origin config` |

**Hecho cuando:** `http://IP_PUBLICA` desde fuera de EC2 muestra la app, login y respuesta real; 401 sin token; `docker restart` y re-comprobación; SG con solo SSH (3 IPs /32) y 80.
**Tag:** `v1.0-aws` lo crea **C**; release en GitHub con las dos URLs.

### Fase 7 · Cierre: README, evidencias y defensa (todos)

| Persona | Rama | Commits |
| --- | --- | --- |
| **C** | `docs/c-readme-final` | `docs: complete identification, git milestones and evidence index` · `chore: remove plan folder before delivery` |
| **A** | `docs/a-security-review` | `docs: add secrets audit and operation checks` |
| **B** | `docs/b-presentation` | `docs: add architecture diagram and demo script` |

- Auditoría de secretos en **todo** el historial: `git log -p --all | grep -nEi 'sk-|sk_(test|live)_|BEGIN .*PRIVATE KEY|AKIA'` (vacío). Revisad también capturas y diapositivas.
- Presentación: un archivo/enlace; cada persona presenta una parte (propuesta: A seguridad+Clerk, B Vercel+Git, C Docker+AWS+operación).
- Ensayo de comprensión cruzada: C (Nicolas) ejecuta `vercel logs`; A (Pablo) entra por SSH y hace `docker logs`; B (Javier) explica y muestra la validación del token en FastAPI.
- Entrega: repo, tag+commit final, URL Vercel, URL HTTP EC2, README, presentación.
- Después de la defensa: parar/terminar EC2 y recursos asociados (volumen, IPs); revocar claves de IA y Clerk de la práctica.

## 4. Orden sugerido y paralelismo

```
F0 ──► F1 (A,C) ──► F2 (B; C: EC2; A: CORS) ──► F3 (B,C,A) ──► F4 (A,B,C) ──► F5 (A,B,C) ──► F6 (C,A,B) ──► F7
              └─ B puede empezar F2 con la API simulada desde el primer día
                                   └─ C no espera a F5 para tener la EC2 lista
```

- **Clase presencial (4 h):** F0, F1, F2 en paralelo y arrancar F3 con el profesor cerca (Vercel/Clerk son lo que más dudas generan).
- **En casa:** F3 completa, F4, F5, F6 (reservad una sesión larga de Learner Lab), F7.
- Cada merge actualiza el README **en la misma rama**: la documentación la escribimos todos a la vez, no al final.

## 5. Lista de riesgos

| Riesgo | Mitigación |
| --- | --- |
| Vercel Hobby sin miembros | Dueño único del proyecto + sesiones conjuntas + `Co-authored-by` |
| Preview protegida: el 401 lo da Vercel, no FastAPI | Evidencia de rechazo siempre contra la URL de **producción** |
| Variable `VITE_*` cambiada y sin recompilar | Redeploy en Vercel; `docker build` de nuevo |
| IP de EC2 cambia al parar/arrancar | Actualizar `CLERK_AUTHORIZED_PARTIES`, reiniciar contenedor, actualizar URL en README |
| t3.micro sin memoria para compilar Vite | Swap de 2 GB o construir en local y `docker save`/`docker load` |
| Learner Lab caduca durante la demo | Arrancarlo antes; tener evidencias de respaldo; recordad que no sustituyen la comprobación |
| Secreto subido por error | Rotar al instante; reescribir historial; no basta borrar el archivo |
