import { describe, expect, it } from 'vitest';
import { OrderStatusCellComponent } from './order-status-cell.component';

describe('OrderStatusCellComponent', () => {
  it('maps an order status to its French label', () => {
    const component = new OrderStatusCellComponent();

    component.agInit({ value: 'READY' } as never);

    expect(component.status).toBe('READY');
    expect(component.label).toBe('Prête');
  });

  it('refreshes the rendered status', () => {
    const component = new OrderStatusCellComponent();

    expect(component.refresh({ value: 'CANCELED' } as never)).toBe(true);
    expect(component.label).toBe('Annulée');
  });
});
