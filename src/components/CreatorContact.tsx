import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';

export default function CreatorContact() {
  const [form, setForm] = useState({
    clientName: '',
    email: '',
    message: '',
    customRequest: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(getFirebaseDb(), 'creator_messages'), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      setError('Error al enviar el mensaje');
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

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-[#f5e6c8]">Contacta al Creador</h2>
      <p className="text-[#a89a82]">¿Tienes una idea personalizada? Escríbenos.</p>

      <input
        type="text"
        placeholder="Tu nombre"
        required
        value={form.clientName}
        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
        className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
      />

      <input
        type="email"
        placeholder="Tu email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
      />

      <textarea
        placeholder="Tu mensaje o solicitud"
        required
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-2 text-[#f5e6c8] placeholder-[#a89a82] focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
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

      {error && <p className="text-red-400 text-sm">{error}</p>}

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
