import type { CSSProperties } from 'react'
import ShinyText from './ShinyText'

const CARTAS = 12
const ZODIACO = '♈♉♊♋♌♍♎♏♐♑♒♓'
const DESTELLOS = 18

function Dorso() {
  return (
    <svg viewBox="0 0 100 160" fill="none" stroke="#e9c46a" strokeWidth="1.5">
      <rect x="6" y="6" width="88" height="148" rx="6" />
      <rect x="11" y="11" width="78" height="138" rx="4" strokeOpacity=".35" />
      <circle cx="50" cy="80" r="26" />
      <circle cx="50" cy="80" r="19" strokeOpacity=".4" />
      <path
        d="M50 50 L56 74 L80 80 L56 86 L50 110 L44 86 L20 80 L44 74 Z"
        fill="#e9c46a"
        fillOpacity=".25"
      />
      <circle cx="50" cy="80" r="4" fill="#e9c46a" />
      <path d="M44 22 a9 9 0 1 0 12 0 a7 7 0 1 1 -12 0" fill="#e9c46a" fillOpacity=".5" />
      <path d="M44 138 a9 9 0 1 1 12 0 a7 7 0 1 0 -12 0" fill="#e9c46a" fillOpacity=".5" />
    </svg>
  )
}

export default function Barajado({ nombre }: { nombre: string }) {
  const frases = [
    `Las cartas escuchan tu pregunta, ${nombre || 'consultante'}…`,
    'Los arcanos despiertan…',
    'Las estrellas alinean tu destino…',
    'El velo se aparta…',
  ]

  return (
    <div
      role="status"
      aria-live="polite"
      className="barajado fixed inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-black/70 px-4 backdrop-blur-md"
    >
      {Array.from({ length: DESTELLOS }, (_, i) => (
        <span
          key={i}
          className="destello"
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            animationDelay: `${(i * 0.37) % 3}s`,
          }}
        />
      ))}

      <div className="relative flex h-[340px] w-[340px] max-w-full items-center justify-center">
        <div className="aura" />
        <div className="zodiaco">
          {[...ZODIACO].map((signo, i) => (
            <span key={signo} style={{ transform: `rotate(${i * 30}deg) translateY(-160px)` }}>
              {signo}&#xFE0E;
            </span>
          ))}
        </div>

        <div className="baraja">
          {Array.from({ length: CARTAS }, (_, i) => (
            <div
              key={i}
              className="carta-dorso"
              style={
                {
                  '--i': i,
                  '--lado': i % 2 ? 1 : -1,
                  '--abanico': `${(i - (CARTAS - 1) / 2) * 9}deg`,
                  zIndex: i,
                } as CSSProperties
              }
            >
              <Dorso />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 font-display text-2xl font-bold sm:text-3xl">
        <ShinyText text="Barajando el destino" color="#c4b5fd" shineColor="#ffffff" speed={2} />
      </p>
      <div className="relative mt-3 h-7 w-full max-w-md text-center text-violet-200/80">
        {frases.map((f, i) => (
          <span key={i} className="frase" style={{ animationDelay: `${i * 2.5}s` }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}
