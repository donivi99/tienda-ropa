import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AddressFields from '../shipping/AddressFields';
import type { ShippingAddress } from '../../types';
import {
  profileToShippingAddress,
  shippingAddressToProfileUpdate,
  validateShippingAddress,
} from '../../utils/shippingAddress';

interface ProfileData {
  nombre: string;
  phone?: string;
  address?: ShippingAddress;
}

interface ProfileDataFormProps {
  profile: ProfileData | null;
  onSaved: () => Promise<void>;
}

export default function ProfileDataForm({ profile, onSaved }: ProfileDataFormProps) {
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState(() => profileToShippingAddress(profile ?? undefined));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    const fromProfile = profileToShippingAddress(profile);
    setNombre(fromProfile.nombre);
    setPhone(fromProfile.telefono);
    setStreet(fromProfile);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const shippingAddress: ShippingAddress = { ...street, nombre: nombre.trim(), telefono: phone.trim() };
    const validationError = validateShippingAddress(shippingAddress);
    if (validationError) {
      setSaveMsg({ type: 'err', text: validationError });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put('/api/auth/me', shippingAddressToProfileUpdate(shippingAddress));
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

        <AddressFields
          idPrefix="profile"
          value={street}
          onChange={(patch) => setStreet((current) => ({ ...current, ...patch }))}
          inputClass={inputClass}
        />

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
