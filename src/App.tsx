import { useState } from 'react'

const MAX_CHARS = 2000

export default function App() {
  const [texto, setTexto] = useState('')
  const [resumen, setResumen] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function resumir(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')
    setResumen('')
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 422 trae `detail` como lista de errores de validación; 502/504 como texto
        setError(
          typeof data.detail === 'string'
            ? data.detail
            : 'El texto no es válido: debe tener entre 1 y 2000 caracteres',
        )
        return
      }
      setResumen(data.resumen)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Resumidor</h1>
      <form onSubmit={resumir} className="mt-4 space-y-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={MAX_CHARS}
          rows={8}
          placeholder="Pega aquí el texto que quieres resumir"
          className="w-full rounded border border-gray-300 p-2"
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {texto.length}/{MAX_CHARS}
          </span>
          <button
            type="submit"
            disabled={cargando || !texto.trim()}
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {cargando ? 'Resumiendo…' : 'Resumir'}
          </button>
        </div>
      </form>
      {error && (
        <p
          role="alert"
          className="mt-6 rounded border border-red-300 bg-red-50 p-3 text-red-800"
        >
          {error}
        </p>
      )}
      {resumen && (
        <section className="mt-6 rounded border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-semibold">Resumen</h2>
          <p className="mt-2 whitespace-pre-wrap">{resumen}</p>
        </section>
      )}
    </main>
  )
}
