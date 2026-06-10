import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#2a2520] bg-[#0a0a0a]">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="inline-block text-lg font-bold text-[#d4af37] tracking-widest uppercase" style={{ fontFamily: '"Bodoni Moda", serif' }}>
              tiendaRopa
            </Link>
            <p className="text-sm leading-6 text-[#a89a82]">
              Moda con carácter, sin ruido visual. Prendas seleccionadas para personas que saben lo que quieren vestir.
            </p>
            <div className="flex gap-3 pt-2">
              {['Instagram', 'TikTok', 'Pinterest'].map((s) => (
                <span key={s} className="rounded-full border border-[#2a2520] px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-[#a89a82] transition-colors hover:border-[#d4af37] hover:text-[#d4af37] cursor-pointer">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-[#f5e6c8]">Tienda</h4>
            <ul className="space-y-2.5 text-sm text-[#a89a82]">
              <li><Link to="/categoria-mujer" className="transition-colors hover:text-[#f5e6c8]">Mujer</Link></li>
              <li><Link to="/categoria-hombre" className="transition-colors hover:text-[#f5e6c8]">Hombre</Link></li>
              <li><Link to="/categoria-destacados" className="transition-colors hover:text-[#f5e6c8]">Destacados</Link></li>
              <li><Link to="/sobre-nosotros" className="transition-colors hover:text-[#f5e6c8]">Sobre nosotros</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-[#f5e6c8]">Ayuda</h4>
            <ul className="space-y-2.5 text-sm text-[#a89a82]">
              <li><span className="transition-colors hover:text-[#f5e6c8] cursor-pointer">Envíos</span></li>
              <li><span className="transition-colors hover:text-[#f5e6c8] cursor-pointer">Devoluciones</span></li>
              <li><span className="transition-colors hover:text-[#f5e6c8] cursor-pointer">Guía de tallas</span></li>
              <li><span className="transition-colors hover:text-[#f5e6c8] cursor-pointer">Preguntas frecuentes</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-[#f5e6c8]">Contacto</h4>
            <ul className="space-y-2.5 text-sm text-[#a89a82]">
              <li>hola@tiendaropa.com</li>
              <li>+34 600 123 456</li>
              <li>Lun - Vie, 9:00 - 18:00</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#2a2520] py-6 sm:flex-row">
          <p className="text-xs text-[#5f574d]">&copy; {new Date().getFullYear()} tiendaRopa. Todos los derechos reservados.</p>
          <div className="flex gap-5 text-xs text-[#5f574d]">
            <span className="cursor-pointer transition-colors hover:text-[#a89a82]">Política de privacidad</span>
            <span className="cursor-pointer transition-colors hover:text-[#a89a82]">Términos y condiciones</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
