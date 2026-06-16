import type { ShippingAddress } from '../../types';
import { formatAddressDetails, formatStreetLine } from '../../utils/orderUi';

interface AddressDisplayProps {
  address: ShippingAddress;
  showContact?: boolean;
  className?: string;
}

export default function AddressDisplay({ address, showContact = true, className = '' }: AddressDisplayProps) {
  const details = formatAddressDetails(address);

  return (
    <div className={`space-y-1 text-sm text-[#f5e6c8] ${className}`}>
      {showContact && (
        <>
          <p>{address.nombre}</p>
          <p className="text-[#a89a82]">Tel: {address.telefono}</p>
        </>
      )}
      <p>{formatStreetLine(address)}</p>
      {details && <p className="text-[#a89a82]">{details}</p>}
      <p>
        {address.codigoPostal} {address.ciudad}, {address.provincia}
      </p>
      {address.referencias?.trim() && (
        <p className="text-[#a89a82]">Ref: {address.referencias.trim()}</p>
      )}
    </div>
  );
}
