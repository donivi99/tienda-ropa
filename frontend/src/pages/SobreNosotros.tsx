import { useState } from 'react';

export default function SobreNosotros() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-[#d4af37]/10 via-[#f5e6c8]/5 to-transparent" />
      <div className="pointer-events-none absolute right-[-10rem] top-40 h-72 w-72 rounded-full bg-[#d4af37]/8 blur-3xl" />

      <div className="relative mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">

        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#d4af37]/20 bg-[#141210]/80 px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-[#d4af37] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
            Nuestra marca
          </div>
          <h1 className="font-heading text-4xl font-semibold text-[#f5e6c8] sm:text-5xl lg:text-6xl">
            Sobre Nosotros
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-base leading-7 text-[#a89a82] sm:text-lg">
            Conoce la historia, los valores y la filosofía detrás de cada prenda que creamos.
          </p>
        </header>

        <section className="mb-16">
          <div className="rounded-[2rem] border border-white/8 bg-[#11100e]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.6fr] lg:items-center">
              <div className="space-y-5">
                <h2 className="font-heading text-2xl font-semibold text-[#f5e6c8]">
                  Nuestra Historia
                </h2>
                <p className="text-[#a89a82] leading-7">
                  tiendaRopa nació de una idea simple: crear ropa con personalidad, sin sacrificar la calidad ni la comodidad. Lo que empezó como un pequeño proyecto entre amigos apasionados por la moda, se convirtió en una marca con identidad propia, pensada para personas que saben lo que quieren vestir.
                </p>
                <p className="text-[#a89a82] leading-7">
                  Cada colección está cuidadosamente seleccionada, desde los tejidos hasta los acabados finales. No seguimos tendencias ciegamente: las reinterpretamos a nuestro estilo para ofrecer prendas atemporales con un toque contemporáneo.
                </p>
                <p className="text-[#a89a82] leading-7">
                  Trabajamos con proveedores comprometidos con prácticas responsables y selects tejidos de origen certificado. Creemos que la moda puede ser hermosa, funcional y más consciente al mismo tiempo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#d4af37]/15 bg-[#141210] p-5 text-center">
                  <p className="text-3xl font-semibold text-[#d4af37]">2020</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#a89a82]">Fundación</p>
                </div>
                <div className="rounded-2xl border border-[#d4af37]/15 bg-[#141210] p-5 text-center">
                  <p className="text-3xl font-semibold text-[#d4af37]">5k+</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#a89a82]">Clientes</p>
                </div>
                <div className="rounded-2xl border border-[#d4af37]/15 bg-[#141210] p-5 text-center">
                  <p className="text-3xl font-semibold text-[#d4af37]">160</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#a89a82]">Productos</p>
                </div>
                <div className="rounded-2xl border border-[#d4af37]/15 bg-[#141210] p-5 text-center">
                  <p className="text-3xl font-semibold text-[#d4af37]">4.9</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#a89a82]">Valoración</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-heading text-center text-2xl font-semibold text-[#f5e6c8] mb-10">
            Nuestros Valores
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '✦', title: 'Calidad', desc: 'Tejidos selectos, costuras reforzadas y acabados premium en cada pieza.' },
              { icon: '◈', title: 'Diseño', desc: 'Prendas con identidad que no pasan de moda y se adaptan a tu estilo.' },
              { icon: '❖', title: 'Sostenibilidad', desc: 'Materiales responsables y producción pensada para durar, no para tirar.' },
              { icon: '✧', title: 'Servicio', desc: 'Atención cercana, envíos rápidos y devoluciones sin complicaciones.' },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl border border-white/8 bg-[#141210] p-6 transition-all hover:border-[#d4af37]/30 hover:-translate-y-1">
                <span className="text-2xl text-[#d4af37]">{v.icon}</span>
                <h3 className="font-heading mt-4 text-lg font-semibold text-[#f5e6c8]">{v.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#a89a82]">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="rounded-[2rem] border border-white/8 bg-[#11100e]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8 lg:p-10">
            <h2 className="font-heading text-2xl font-semibold text-[#f5e6c8] mb-6">
              Nuestra Misión
            </h2>
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <p className="text-[#a89a82] leading-7">
                  Creemos que la moda debe ser accesible sin sacrificar la calidad. Nos esforzamos por ofrecer prendas que se adapten a diferentes estilos de vida, siempre con un toque elegante y contemporáneo.
                </p>
                <p className="text-[#a89a82] leading-7">
                  Nuestro compromiso es con nuestros clientes: servicio excepcional, productos de primera y una experiencia de compra satisfactoria de principio a fin.
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-[#a89a82] leading-7">
                  Cada decisión que tomamos — desde elegir un botón hasta diseñar el empaque — está pensada para que sientas que compraste algo especial. No es solo ropa, es una experiencia.
                </p>
                <p className="text-[#a89a82] leading-7">
                  Queremos que al abrir tu pedido sientas la misma emoción que tuvimos al crear la prenda. Ese es nuestro estándar y no bajamos la mirada.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-heading text-center text-2xl font-semibold text-[#f5e6c8] mb-10">
            Lo que nos define
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { title: 'Selección Manual', desc: 'Cada producto es revisado y aprobado antes de entrar a colección.' },
              { title: 'Envío Garantizado', desc: 'Packaging premium y seguimiento en tiempo real de tu pedido.' },
              { title: 'Soporte Real', desc: 'Un equipo humano que responde rápido y resuelve de verdad.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#2a2520] bg-[#141210] p-6">
                <h3 className="font-heading text-base font-semibold text-[#f5e6c8]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#a89a82]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="rounded-[2rem] border border-white/8 bg-[#11100e]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="text-center mb-10">
              <h3 className="font-heading text-2xl font-semibold text-[#f5e6c8]">
                Contactanos
              </h3>
              <p className="mt-3 text-[#a89a82]">
                ¿Tienes una pregunta, sugerencia o necesitas soporte? Escríbenos y te responderemos lo antes posible.
              </p>
            </div>

            {submitted ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-[#d4af37]/20 bg-[#141210] p-8 text-center">
                <span className="text-3xl">✉</span>
                <p className="mt-4 text-lg font-semibold text-[#f5e6c8]">Mensaje enviado</p>
                <p className="mt-2 text-sm text-[#a89a82]">Gracias por escribirnos. Te responderemos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.28em] text-[#a89a82]">Nombre</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-[#2a2520] bg-[#141210] px-4 py-3 text-sm text-[#f5e6c8] outline-none transition-colors placeholder:text-[#5f574d] focus:border-[#d4af37]"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.28em] text-[#a89a82]">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-[#2a2520] bg-[#141210] px-4 py-3 text-sm text-[#f5e6c8] outline-none transition-colors placeholder:text-[#5f574d] focus:border-[#d4af37]"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.28em] text-[#a89a82]">Asunto</label>
                  <input
                    required
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-xl border border-[#2a2520] bg-[#141210] px-4 py-3 text-sm text-[#f5e6c8] outline-none transition-colors placeholder:text-[#5f574d] focus:border-[#d4af37]"
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.28em] text-[#a89a82]">Mensaje</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full resize-none rounded-xl border border-[#2a2520] bg-[#141210] px-4 py-3 text-sm text-[#f5e6c8] outline-none transition-colors placeholder:text-[#5f574d] focus:border-[#d4af37]"
                    placeholder="Escribí tu mensaje aquí..."
                  />
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="rounded-full border border-[#d4af37] bg-[#d4af37] px-8 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#0a0a0a] transition-all hover:bg-[#c9a432] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                  >
                    Enviar mensaje
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
