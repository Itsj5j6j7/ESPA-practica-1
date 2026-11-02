import { useRef, useState } from 'react'
import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/react'
import Balatro from './components/Balatro'
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
  cartas: Carta[]
  lectura: string
}

const hoy = new Date().toISOString().slice(0, 10)

const campo =
  'w-full rounded-xl border border-violet-400/30 bg-black/40 px-4 py-3 text-violet-50 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/40'

export default function App() {
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [tirada, setTirada] = useState<Tirada | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const intro = useRef<HTMLDivElement>(null)
  const { getToken } = useAuth()

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
        body: JSON.stringify({ fecha, hora: hora || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(
          typeof data.detail === 'string'
            ? data.detail
            : 'La fecha no es válida',
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
              label="Dime cuándo naciste y las estrellas moverán las cartas para ti."
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
            className="mt-10 w-full max-w-md space-y-4 rounded-3xl border border-violet-400/20 bg-black/50 p-6 shadow-[0_0_60px_-15px_#7c3aed] backdrop-blur-md"
          >
            <label className="block text-sm text-violet-200/80">
              Fecha de nacimiento
              <input
                type="date"
                required
                min="1900-01-01"
                max={hoy}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={`${campo} mt-1`}
              />
            </label>
            <label className="block text-sm text-violet-200/80">
              Hora de nacimiento <span className="text-violet-300/50">(opcional)</span>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={`${campo} mt-1`}
              />
            </label>
            <button
              type="submit"
              disabled={cargando || !fecha}
              className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-display font-bold tracking-wide text-white shadow-lg shadow-violet-900/50 transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando ? (
                <ShinyText text="Barajando el destino…" color="#e9d5ff" shineColor="#ffffff" />
              ) : (
                'Tirar las cartas'
              )}
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

        {tirada && (
          <section className="mt-14 w-full">
            <p className="aparecer text-center font-display text-lg text-violet-200">
              Signo: <span className="font-bold text-white">{tirada.signo}</span>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              {tirada.cartas.map((c, i) => (
                <figure
                  key={c.indice}
                  className="aparecer text-center"
                  style={{ animationDelay: `${0.3 + i * 0.35}s` }}
                >
                  <HoloCard
                    image={`/tarot/${String(c.indice).padStart(2, '0')}.jpg`}
                    alt={c.nombre}
                    preset="rainbow"
                    width={220}
                  />
                  <figcaption className="mt-4 font-display">
                    <span className="block text-xs uppercase tracking-[0.3em] text-violet-300/70">
                      {c.posicion}
                    </span>
                    <span className="text-lg font-bold text-white">{c.nombre}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <article
              className="aparecer mx-auto mt-12 max-w-2xl space-y-4 rounded-3xl border border-violet-400/20 bg-black/50 p-6 leading-relaxed text-violet-100 backdrop-blur-md sm:p-8"
              style={{ animationDelay: '1.5s' }}
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
