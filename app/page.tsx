import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90 mb-3">
            Gestión de comunidades
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Fincas SaaS
          </h1>
          <p className="mt-3 text-slate-400 text-sm">
            ¿Cómo quieres acceder?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/login"
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 hover:bg-slate-800/70 hover:border-cyan-500/30 transition-all group"
          >
            <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
              Soy administrador
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Accede al panel de gestión de comunidades e incidencias
            </p>
          </Link>

          <Link
            href="/vecino"
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 hover:bg-slate-800/70 hover:border-cyan-500/30 transition-all group"
          >
            <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
              Soy vecino
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Consulta y reporta incidencias de tu comunidad
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
