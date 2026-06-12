import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface CreatorContactProps {
  defaultName?: string;
  defaultEmail?: string;
}

export default function CreatorContact({ defaultName = '', defaultEmail = '' }: CreatorContactProps) {
  const [form, setForm] = useState({
    clientName: defaultName,
    email: defaultEmail,
    message: '',
    customRequest: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      clientName: current.clientName || defaultName,
      email: current.email || defaultEmail,
    }));
  }, [defaultName, defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/contact', {
        clientName: form.clientName,
        message: form.message,
        customRequest: form.customRequest,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2 text-[#f5e6c8]">Mensaje enviado</h3>
        <p className="text-[#a89a82]">Gracias por contactarnos. Te responderemos pronto.</p>
      </div>
    );
  }

  const inputClass =
    'w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none';

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <input
        type="text"
        placeholder="Tu nombre"
        required
        value={form.clientName}
        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
        className={inputClass}
        aria-label="Tu nombre"
      />

      <input
        type="email"
        placeholder="Tu email"
        required
        readOnly
        value={form.email}
        className={`${inputClass} opacity-70`}
        aria-label="Tu email"
      />

      <textarea
        placeholder="Tu mensaje o solicitud"
        required
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={inputClass}
        aria-label="Tu mensaje"
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.customRequest}
          onChange={(e) => setForm({ ...form, customRequest: e.target.checked })}
          className="w-4 h-4 accent-[#d4af37]"
        />
        <span className="text-sm text-[#a89a82]">Es un pedido personalizado</span>
      </label>

      {error && (
        <p className="text-red-400 text-sm" role="status" aria-live="polite">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#d4af37] text-[#0a0a0a] py-3 rounded-lg font-bold hover:bg-[#b8962e] disabled:opacity-50 transition-colors uppercase tracking-wider"
      >
        {loading ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  );
}
