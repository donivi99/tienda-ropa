import { useEffect, useState } from 'react';
import { api } from '../../services/api';

const CP_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

interface ProfileData {
  nombre: string;
  phone?: string;
  address?: {
    calle?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    referencias?: string;
  };
}

interface ProfileDataFormProps {
  profile: ProfileData | null;
  onSaved: () => Promise<void>;
}

export default function ProfileDataForm({ profile, onSaved }: ProfileDataFormProps) {
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [calle, setCalle] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [referencias, setReferencias] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setNombre(profile.nombre || '');
    setPhone(profile.phone || '');
    setCalle(profile.address?.calle || '');
    setCiudad(profile.address?.ciudad || '');
    setProvincia(profile.address?.provincia || '');
    setCodigoPostal(profile.address?.codigoPostal || '');
    setReferencias(profile.address?.referencias || '');
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || nombre.trim().length < 2 || nombre.length > 100) {
      setSaveMsg({ type: 'err', text: 'Nombre inválido (2-100 caracteres)' });
      return;
    }
    if (!phone.trim() || phone.trim().length < 6 || phone.length > 20) {
      setSaveMsg({ type: 'err', text: 'Teléfono inválido (6-20 caracteres)' });
      return;
    }
    if (!calle.trim() || calle.trim().length < 3 || calle.length > 200) {
      setSaveMsg({ type: 'err', text: 'Calle inválida (3-200 caracteres)' });
      return;
    }
    if (!ciudad.trim() || ciudad.trim().length < 2 || ciudad.length > 100) {
      setSaveMsg({ type: 'err', text: 'Ciudad inválida (2-100 caracteres)' });
      return;
    }
    if (!provincia.trim() || provincia.trim().length < 2 || provincia.length > 100) {
      setSaveMsg({ type: 'err', text: 'Provincia inválida (2-100 caracteres)' });
      return;
    }
    if (!CP_REGEX.test(codigoPostal.trim())) {
      setSaveMsg({ type: 'err', text: 'Código postal inválido' });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put('/api/auth/me', {
        nombre: nombre.trim(),
        phone: phone.trim(),
        address: {
          calle: calle.trim(),
          ciudad: ciudad.trim(),
          provincia: provincia.trim(),
          codigoPostal: codigoPostal.trim(),
          referencias: referencias.trim() || undefined,
        },
      });
      await onSaved();
      setSaveMsg({ type: 'ok', text: 'Datos guardados correctamente' });
    } catch (err) {
      setSaveMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error al guardar los datos',
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] focus:outline-none transition-all';

  return (
    <div className="space-y-6" role="tabpanel" id="panel-data" aria-labelledby="tab-data">
      <div>
        <h1 className="text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
          Mis Datos
        </h1>
        <p className="text-[#a89a82] text-sm mt-1">Información para tus envíos a domicilio</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#141210] border border-[#2a2520] rounded-xl p-6 space-y-6">
        <div>
          <label htmlFor="profile-nombre" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Nombre *
          </label>
          <input
            id="profile-nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            maxLength={100}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Teléfono *
          </label>
          <input
            id="profile-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="612345678"
            maxLength={20}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profile-calle" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Calle *
          </label>
          <input
            id="profile-calle"
            type="text"
            required
            value={calle}
            onChange={(e) => setCalle(e.target.value)}
            placeholder="Calle Mayor 15"
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-ciudad" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
              Ciudad *
            </label>
            <input
              id="profile-ciudad"
              type="text"
              required
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Madrid"
              maxLength={100}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profile-provincia" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
              Provincia *
            </label>
            <input
              id="profile-provincia"
              type="text"
              required
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              placeholder="Madrid"
              maxLength={100}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-cp" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Código Postal *
          </label>
          <input
            id="profile-cp"
            type="text"
            required
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
            placeholder="28001"
            maxLength={5}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profile-ref" className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Referencias
          </label>
          <textarea
            id="profile-ref"
            value={referencias}
            onChange={(e) => setReferencias(e.target.value)}
            placeholder="Piso 2B, timbre izquierdo..."
            rows={2}
            maxLength={300}
            className={`${inputClass} resize-none`}
          />
        </div>

        {saveMsg && (
          <div
            role="status"
            aria-live="polite"
            className={`px-4 py-3 rounded-lg text-sm ${
              saveMsg.type === 'ok'
                ? 'bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]'
                : 'bg-red-900/20 border border-red-800/50 text-red-300'
            }`}
          >
            {saveMsg.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#d4af37] text-[#0a0a0a] px-8 py-3 rounded-lg font-bold hover:bg-[#b8962e] disabled:opacity-50 transition-colors uppercase tracking-wider text-sm"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : 'Guardar Datos'}
          </button>
        </div>
      </form>
    </div>
  );
}
