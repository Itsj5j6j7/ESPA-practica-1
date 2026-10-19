import { useState } from 'react'

const MAX_CHARS = 2000

export default function App() {
  const [texto, setTexto] = useState('')
  const [resumen, setResumen] = useState('')

  async function resumir(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    })
    const data = await res.json()
    setResumen(data.resumen)
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
            disabled={!texto.trim()}
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Resumir
          </button>
        </div>
      </form>
      {resumen && (
        <section className="mt-6 rounded border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-semibold">Resumen</h2>
          <p className="mt-2 whitespace-pre-wrap">{resumen}</p>
        </section>
      )}
    </main>
  )
}
