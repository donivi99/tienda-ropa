import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAdminAllowedStatuses,
  isAdminOrderTransitionAllowed,
} from './adminOrderTransitions.js';

describe('adminOrderTransitions', () => {
  it('blocks pendiente_pago → pagado', () => {
    assert.equal(isAdminOrderTransitionAllowed('pendiente_pago', 'pagado'), false);
  });

  it('allows pendiente_pago → cancelado', () => {
    assert.equal(isAdminOrderTransitionAllowed('pendiente_pago', 'cancelado'), true);
  });

  it('allows pagado → enviado and entregado', () => {
    assert.deepEqual(getAdminAllowedStatuses('pagado'), ['enviado', 'entregado', 'cancelado']);
  });

  it('blocks entregado → any', () => {
    assert.deepEqual(getAdminAllowedStatuses('entregado'), []);
  });

  it('allows reembolso_pendiente → cancelado only', () => {
    assert.deepEqual(getAdminAllowedStatuses('reembolso_pendiente'), ['cancelado']);
  });
});
