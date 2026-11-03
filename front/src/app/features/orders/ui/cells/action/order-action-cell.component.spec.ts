import { describe, expect, it, vi } from 'vitest';
import { OrderActionCellComponent } from './order-action-cell.component';

describe('OrderActionCellComponent', () => {
  const order = { id: 12 } as never;

  it('calls the action for an eligible order and stops propagation', () => {
    const onAdvance = vi.fn();
    const component = new OrderActionCellComponent();
    component.agInit({
      data: order,
      label: 'Avancer',
      canAdvance: () => true,
      onAdvance,
    } as never);
    const event = { stopPropagation: vi.fn() };

    component.advance(event as unknown as Event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(onAdvance).toHaveBeenCalledWith(order);
  });

  it('does not call the action when the order cannot advance', () => {
    const onAdvance = vi.fn();
    const component = new OrderActionCellComponent();
    component.agInit({
      data: order,
      label: 'Avancer',
      canAdvance: () => false,
      onAdvance,
    } as never);

    component.advance({ stopPropagation: vi.fn() } as never);

    expect(onAdvance).not.toHaveBeenCalled();
  });
});
