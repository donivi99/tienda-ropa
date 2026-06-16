import type { StreetAddressValue } from '../../utils/shippingAddress';

interface AddressFieldsProps {
  value: StreetAddressValue;
  onChange: (patch: Partial<StreetAddressValue>) => void;
  inputClass: string;
  idPrefix?: string;
}

export default function AddressFields({
  value,
  onChange,
  inputClass,
  idPrefix = 'addr',
}: AddressFieldsProps) {
  const field = (name: keyof StreetAddressValue) => ({
    id: `${idPrefix}-${String(name)}`,
    value: value[name] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ [name]: e.target.value }),
  });

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-calle`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
          Calle *
        </label>
        <input
          {...field('calle')}
          type="text"
          required
          placeholder="Calle Mayor"
          maxLength={150}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-numero`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Número *
          </label>
          <input
            {...field('numero')}
            type="text"
            required
            placeholder="15"
            maxLength={10}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-portal`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Portal
          </label>
          <input
            {...field('portal')}
            type="text"
            placeholder="3"
            maxLength={10}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-escalera`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Escalera
          </label>
          <input
            {...field('escalera')}
            type="text"
            placeholder="Izda."
            maxLength={10}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-piso`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Piso
          </label>
          <input
            {...field('piso')}
            type="text"
            placeholder="2º"
            maxLength={10}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-puerta`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Puerta
          </label>
          <input
            {...field('puerta')}
            type="text"
            placeholder="B"
            maxLength={10}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-cp`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Código Postal *
          </label>
          <input
            {...field('codigoPostal')}
            type="text"
            required
            placeholder="28001"
            maxLength={5}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-ciudad`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Ciudad *
          </label>
          <input
            {...field('ciudad')}
            type="text"
            required
            placeholder="Madrid"
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-provincia`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
            Provincia *
          </label>
          <input
            {...field('provincia')}
            type="text"
            required
            placeholder="Madrid"
            maxLength={100}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-ref`} className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">
          Referencias
        </label>
        <textarea
          {...field('referencias')}
          placeholder="Timbre roto, llamar al móvil..."
          rows={2}
          maxLength={300}
          className={`${inputClass} resize-none`}
        />
      </div>
    </>
  );
}
