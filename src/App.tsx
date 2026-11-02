import { useRef, useState } from 'react'
import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/react'
import Balatro from './components/Balatro'
import Barajado from './components/Barajado'
import HoloCard from './components/HoloCard'
import ShinyText from './components/ShinyText'
import VariableProximity from './components/VariableProximity'

interface Carta {
  indice: number
  nombre: string
  posicion: string
}

interface Tirada {
  signo: string
  carta_personal: Carta
  arcano_anio: Carta
  cartas: Carta[]
  lectura: string
}

const hoy = new Date().toISOString().slice(0, 10)

const TEMAS = ['amor', 'trabajo', 'dinero', 'salud', 'desarrollo personal', 'familia', 'decisiones', 'general']
const MARCOS = ['presente', 'próximas semanas', '3 meses', '1 año']

const consultaVacia = {
  nombre: '',
  fecha: '',
  hora: '',
  tema: 'general',
  pregunta: '',
  contexto: '',
  marco: 'próximas semanas',
  persona: '',
}

const mayuscula = (t: string) => t[0].toUpperCase() + t.slice(1)

const chip =
  'cursor-pointer rounded-full border border-violet-400/30 bg-black/40 px-3 py-1.5 text-sm text-violet-100 transition hover:border-violet-300 has-checked:border-transparent has-checked:bg-gradient-to-r has-checked:from-violet-600 has-checked:to-fuchsia-600 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-violet-400/60'

function Figura({ carta, ancho, retraso }: { carta: Carta; ancho: number; retraso: number }) {
  return (
    <figure className="aparecer text-center" style={{ animationDelay: `${retraso}s` }}>
      <HoloCard
        image={`/tarot/${String(carta.indice).padStart(2, '0')}.jpg`}
        alt={carta.nombre}
        preset="rainbow"
        width={ancho}
      />
      <figcaption className="mt-4 font-display">
        <span className="block text-xs uppercase tracking-[0.3em] text-violet-300/70">
          {carta.posicion}
        </span>
        <span className="text-lg font-bold text-white">{carta.nombre}</span>
      </figcaption>
    </figure>
  )
}

const campo =
  'w-full rounded-xl border border-violet-400/30 bg-black/40 px-4 py-3 text-violet-50 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/40'

export default function App() {
  const [consulta, setConsulta] = useState(consultaVacia)
  const [tirada, setTirada] = useState<Tirada | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const intro = useRef<HTMLDivElement>(null)
  const { getToken } = useAuth()
  const cambiar =
    (k: keyof typeof consultaVacia) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setConsulta({ ...consulta, [k]: e.target.value })

  async function tirarCartas(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')
    setTirada(null)
    try {
      const res = await fetch('/api/tarot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          ...consulta,
          hora: consulta.hora || null,
          contexto: consulta.contexto || null,
          persona: consulta.persona || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(
          typeof data.detail === 'string'
            ? data.detail
            : 'Revisa los datos del formulario',
        )
        return
      }
      setTirada(data)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Balatro
          color1="#7c3aed"
          color2="#2e1065"
          color3="#05020a"
          contrast={3}
          lighting={0.35}
          swirl={0.3}
          speed={0.6}
          pixelSize={2}
        />
      </div>

      <header className="fixed top-0 right-0 z-20 flex items-center gap-3 p-4">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="cursor-pointer rounded-lg px-4 py-2 text-sm text-violet-100 transition hover:bg-white/10">
              Iniciar sesión
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-125">
              Registrarse
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>

      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-4 py-14">
        <div ref={intro} className="text-center">
          <h1 className="font-display text-4xl font-bold sm:text-6xl">
            <ShinyText
              text="Oráculo Astral"
              color="#c4b5fd"
              shineColor="#ffffff"
              speed={3}
            />
          </h1>
          <div className="mx-auto mt-5 max-w-xl text-lg text-violet-200/80">
            <VariableProximity
              label="Cuéntame quién eres y qué te inquieta: las cartas harán el resto."
              containerRef={intro}
              radius={110}
              fromFontVariationSettings="'wght' 300, 'opsz' 14"
              toFontVariationSettings="'wght' 900, 'opsz' 40"
              toColor="#ffffff"
            />
          </div>
        </div>

        <Show when="signed-in">
          <form
            onSubmit={tirarCartas}
            className="mt-10 w-full max-w-xl space-y-8 rounded-3xl border border-violet-400/20 bg-black/50 p-6 shadow-[0_0_60px_-15px_#7c3aed] backdrop-blur-md sm:p-8"
          >
            <fieldset className="space-y-4">
              <legend className="mb-4 font-display text-lg font-bold text-violet-100">Sobre ti</legend>
              <label className="block text-sm text-violet-200/80">
                Nombre o apodo
                <input
                  required
                  maxLength={40}
                  autoComplete="nickname"
                  value={consulta.nombre}
                  onChange={cambiar('nombre')}
                  className={`${campo} mt-1`}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-violet-200/80">
                  Fecha de nacimiento
                  <input
                    type="date"
                    required
                    min="1900-01-01"
                    max={hoy}
                    value={consulta.fecha}
                    onChange={cambiar('fecha')}
                    className={`${campo} mt-1`}
                  />
                </label>
                <label className="block text-sm text-violet-200/80">
                  Hora <span className="text-violet-300/50">(opcional)</span>
                  <input
                    type="time"
                    value={consulta.hora}
                    onChange={cambiar('hora')}
                    className={`${campo} mt-1`}
                  />
                </label>
              </div>
              <p className="text-xs text-violet-300/50">
                Con tu fecha calculamos tu carta personal y tu arcano del año.
              </p>
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="mb-4 font-display text-lg font-bold text-violet-100">Tu consulta</legend>
              <div>
                <p className="text-sm text-violet-200/80">Tema</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TEMAS.map((t) => (
                    <label key={t} className={chip}>
                      <input
                        type="radio"
                        name="tema"
                        value={t}
                        checked={consulta.tema === t}
                        onChange={cambiar('tema')}
                        className="sr-only"
                      />
                      {mayuscula(t)}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block text-sm text-violet-200/80">
                Tu pregunta
                <textarea
                  required
                  minLength={5}
                  maxLength={300}
                  rows={2}
                  placeholder="¿Qué debo saber sobre…?"
                  value={consulta.pregunta}
                  onChange={cambiar('pregunta')}
                  className={`${campo} mt-1 resize-none`}
                />
                <span className="mt-1 block text-xs text-violet-300/50">
                  Formúlala en abierto («¿Qué debo saber sobre…?», «¿Cómo puedo…?») mejor que como un sí o no.
                </span>
              </label>
              <label className="block text-sm text-violet-200/80">
                Contexto <span className="text-violet-300/50">(opcional)</span>
                <textarea
                  maxLength={500}
                  rows={3}
                  placeholder="Describe brevemente tu situación"
                  value={consulta.contexto}
                  onChange={cambiar('contexto')}
                  className={`${campo} mt-1 resize-none`}
                />
              </label>
              <div>
                <p className="text-sm text-violet-200/80">Marco temporal</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MARCOS.map((m) => (
                    <label key={m} className={chip}>
                      <input
                        type="radio"
                        name="marco"
                        value={m}
                        checked={consulta.marco === m}
                        onChange={cambiar('marco')}
                        className="sr-only"
                      />
                      {mayuscula(m)}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block text-sm text-violet-200/80">
                Persona implicada <span className="text-violet-300/50">(opcional)</span>
                <input
                  maxLength={60}
                  placeholder="Nombre o relación: pareja, jefa, hermano…"
                  value={consulta.persona}
                  onChange={cambiar('persona')}
                  className={`${campo} mt-1`}
                />
              </label>
            </fieldset>

            <button
              type="submit"
              disabled={cargando}
              className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-display font-bold tracking-wide text-white shadow-lg shadow-violet-900/50 transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tirar las cartas
            </button>
          </form>
        </Show>
        <Show when="signed-out">
          <div className="mt-10 w-full max-w-md rounded-3xl border border-violet-400/20 bg-black/50 p-6 text-center shadow-[0_0_60px_-15px_#7c3aed] backdrop-blur-md">
            <p className="text-violet-200/80">Inicia sesión para que las cartas te hablen.</p>
            <div className="mt-5 flex justify-center gap-3">
              <SignInButton mode="modal">
                <button className="cursor-pointer rounded-xl border border-violet-400/40 px-5 py-2.5 text-violet-100 transition hover:bg-white/10">
                  Iniciar sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 font-medium text-white transition hover:brightness-125">
                  Registrarse
                </button>
              </SignUpButton>
            </div>
          </div>
        </Show>

        {error && (
          <p
            role="alert"
            className="mt-6 max-w-md rounded-xl border border-rose-400/40 bg-rose-950/60 p-3 text-rose-200 backdrop-blur"
          >
            {error}
          </p>
        )}

        {cargando && <Barajado nombre={consulta.nombre} />}

        {tirada && (
          <section ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} className="mt-14 w-full scroll-mt-6">
            <p className="aparecer text-center font-display text-lg text-violet-200">
              Signo: <span className="font-bold text-white">{tirada.signo}</span>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              <Figura carta={tirada.carta_personal} ancho={150} retraso={0.2} />
              <Figura carta={tirada.arcano_anio} ancho={150} retraso={0.4} />
            </div>
            <p className="aparecer mx-auto mt-12 max-w-2xl text-center font-display text-xl italic text-violet-100" style={{ animationDelay: '0.6s' }}>
              «{consulta.pregunta}»
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              {tirada.cartas.map((c, i) => (
                <Figura key={c.indice} carta={c} ancho={220} retraso={0.8 + i * 0.35} />
              ))}
            </div>
            <article
              className="aparecer mx-auto mt-12 max-w-2xl space-y-4 rounded-3xl border border-violet-400/20 bg-black/50 p-6 leading-relaxed text-violet-100 backdrop-blur-md sm:p-8"
              style={{ animationDelay: '2s' }}
            >
              {tirada.lectura.split(/\n\s*\n/).map((parrafo, i) => (
                <p key={i}>{parrafo}</p>
              ))}
              <p className="pt-2 text-xs text-violet-300/50">
                Solo con fines de entretenimiento. Cartas Rider-Waite (1909), dominio público.
              </p>
            </article>
          </section>
        )}
      </main>
    </>
  )
}
