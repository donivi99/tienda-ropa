import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_SHIPPING_ADDRESS,
  profileToShippingAddress,
  validateShippingAddress,
  normalizeShippingAddress,
  SPAIN_CP_REGEX,
} from './shippingAddress.js';

describe('profileToShippingAddress', () => {
  it('maps profile fields to shipping address', () => {
    const result = profileToShippingAddress({
      nombre: 'Ana',
      phone: '600123456',
      address: { calle: 'Mayor', numero: '1', ciudad: 'Madrid', provincia: 'Madrid', codigoPostal: '28001' },
    });
    assert.equal(result.nombre, 'Ana');
    assert.equal(result.telefono, '600123456');
    assert.equal(result.calle, 'Mayor');
  });

  it('returns empty strings for missing profile', () => {
    const result = profileToShippingAddress(null);
    assert.deepEqual(result, EMPTY_SHIPPING_ADDRESS);
  });
});

describe('validateShippingAddress', () => {
  it('rejects invalid Spanish postal code', () => {
    const err = validateShippingAddress({
      ...EMPTY_SHIPPING_ADDRESS,
      nombre: 'Ana García',
      telefono: '600123456',
      calle: 'Calle Mayor',
      numero: '12',
      ciudad: 'Madrid',
      provincia: 'Madrid',
      codigoPostal: '99999',
    });
    assert.ok(err?.includes('postal'));
  });

  it('accepts valid address', () => {
    const err = validateShippingAddress({
      ...EMPTY_SHIPPING_ADDRESS,
      nombre: 'Ana García',
      telefono: '600123456',
      calle: 'Calle Mayor',
      numero: '12',
      ciudad: 'Madrid',
      provincia: 'Madrid',
      codigoPostal: '28001',
    });
    assert.equal(err, null);
  });
});

describe('normalizeShippingAddress', () => {
  it('trims whitespace from fields', () => {
    const normalized = normalizeShippingAddress({
      ...EMPTY_SHIPPING_ADDRESS,
      nombre: '  Ana  ',
      telefono: ' 600123456 ',
      calle: ' Mayor ',
      numero: '1',
      ciudad: ' Madrid ',
      provincia: ' Madrid ',
      codigoPostal: '28001',
    });
    assert.equal(normalized.nombre, 'Ana');
    assert.equal(normalized.ciudad, 'Madrid');
  });
});

describe('SPAIN_CP_REGEX', () => {
  it('matches valid codes', () => {
    assert.ok(SPAIN_CP_REGEX.test('28001'));
    assert.ok(SPAIN_CP_REGEX.test('01001'));
  });
});
