import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateShippingAddressFields,
  validateProfileAddressFields,
  SPAIN_CP_REGEX,
} from './validation.js';
import { validateProduct, validateProductUpdate } from '../middleware/validate.js';

describe('validateProduct', () => {
  it('rejects missing name', () => {
    const err = validateProduct({ price: 10, category: 'x', genero: 'mujer', tipo: 'corto', images: ['https://a.com/x.jpg'], sizes: ['M'], colors: ['negro'], stock: { M: 1 } });
    assert.equal(err, 'Nombre requerido');
  });

  it('accepts valid product', () => {
    const err = validateProduct({
      name: 'Test',
      price: 19.99,
      category: 'camisetas',
      genero: 'mujer',
      tipo: 'corto',
      images: ['https://example.com/p.jpg'],
      sizes: ['M'],
      colors: ['negro'],
      stock: { M: 5 },
    });
    assert.equal(err, null);
  });
});

describe('validateProductUpdate', () => {
  it('rejects negative price on partial update', () => {
    const err = validateProductUpdate({ price: -1 });
    assert.equal(err, 'Precio inválido');
  });

  it('allows partial valid update', () => {
    const err = validateProductUpdate({ name: 'Nuevo nombre' });
    assert.equal(err, null);
  });
});

describe('validateShippingAddressFields', () => {
  it('requires nombre and telefono', () => {
    const err = validateShippingAddressFields({
      calle: 'Calle Mayor',
      numero: '1',
      ciudad: 'Madrid',
      provincia: 'Madrid',
      codigoPostal: '28001',
    });
    assert.equal(err, 'Nombre requerido');
  });

  it('validates Spanish postal code', () => {
    assert.equal(SPAIN_CP_REGEX.test('28001'), true);
    assert.equal(SPAIN_CP_REGEX.test('99999'), false);
  });
});

describe('validateProfileAddressFields', () => {
  it('allows empty partial profile address', () => {
    const err = validateProfileAddressFields({});
    assert.equal(err, null);
  });
});
