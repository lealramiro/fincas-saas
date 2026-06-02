export default function Home() {
  const stats = [
    { label: 'Comunidades', value: '12', detail: 'Activas este mes' },
    { label: 'Vecinos', value: '1.248', detail: 'Registro completo' },
    { label: 'Incidencias abiertas', value: '18', detail: 'En proceso' },
  ];

  const tasks = [
    'Revisar notificaciones de pago',
    'Responder solicitudes de acceso',
    'Actualizar estado de incidencias urgentes',
  ];

  const incidents = [
    { title: 'Fuga de agua en bloque C', status: 'Pendiente' },
    { title: 'Iluminación LED fuera de servicio', status: 'En proceso' },
    { title: 'Solicitud de junta vecinal', status: 'Programada' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-slate-900/75 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
                Panel de control
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Una vista clara para gestionar tu comunidad.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Controla las comunidades, acompaña a tus vecinos y resuelve incidencias con un panel pensado para prioridades reales.
              </p>
            </div>
            <div className="inline-flex flex-col gap-3 sm:flex-row">
              <a
                href="/admin"
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
              >
                Ir al dashboard
              </a>
              <a
                href="#actividad"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400"
              >
                Ver actividad
              </a>
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/20"
            >
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Actividad reciente</h2>
                <p className="mt-2 text-sm text-slate-400">Incidencias y acciones que requieren atención inmediata.</p>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                En tiempo real
              </span>
            </div>

            <div id="actividad" className="mt-8 space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.title}
                  className="rounded-3xl border border-white/10 bg-slate-950/80 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{incident.title}</p>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                        incident.status === 'Pendiente'
                          ? 'bg-amber-500/15 text-amber-300'
                          : incident.status === 'En proceso'
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {incident.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Se ha asignado a mantenimiento y se está coordinando con el equipo.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
              <h2 className="text-xl font-semibold text-white">Tareas prioritarias</h2>
              <p className="mt-2 text-sm text-slate-400">Prioriza lo que necesita atención antes de cerrar la jornada.</p>
              <ul className="mt-6 space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task}
                    className="rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-200"
                  >
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
              <h2 className="text-xl font-semibold text-white">Resumen rápido</h2>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-slate-100">Eficiencia de gestión</p>
                  <p className="mt-2 text-base text-cyan-300">+18 % más rápido que el mes anterior</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-slate-100">Tasa de respuesta</p>
                  <p className="mt-2 text-base text-emerald-300">92 % de solicitudes atendidas</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
