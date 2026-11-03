import { describe, expect, it } from 'vitest';
import { toOrderRow } from './order-grid.config';

const meal = (status: 'VALIDATION' | 'READY', quantity: number, price: number, createdAt: string) => ({
  status,
  quantity,
  price: price.toFixed(2),
  name: 'Plat',
  comment: undefined,
  createdAt: new Date(createdAt),
});

describe('toOrderRow', () => {
  it('computes status, quantity, total and earliest creation date', () => {
    const row = toOrderRow({
      id: 1,
      table: 4,
      waiterName: 'Alice',
      waiterMatricule: 'A001',
      meals: [
        meal('READY', 2, 12.5, '2026-01-01T12:00:00.000Z'),
        meal('READY', 1, 8, '2026-01-01T11:00:00.000Z'),
      ],
    });

    expect(row.status).toBe('READY');
    expect(row.mealCount).toBe(3);
    expect(row.total).toBe(33);
    expect(row.createdAt).toEqual(new Date('2026-01-01T11:00:00.000Z'));
  });

  it('marks orders with multiple statuses as mixed', () => {
    const row = toOrderRow({
      id: 2,
      table: 5,
      waiterName: 'Bob',
      waiterMatricule: 'B002',
      meals: [
        meal('VALIDATION', 1, 10, '2026-01-01T12:00:00.000Z'),
        meal('READY', 1, 11, '2026-01-01T12:01:00.000Z'),
      ],
    });

    expect(row.status).toBe('MIXED');
  });

  it('marks an empty meal list as canceled', () => {
    const row = toOrderRow({
      id: 3,
      table: 6,
      waiterName: 'Chris',
      waiterMatricule: 'C003',
      meals: [],
    });

    expect(row.status).toBe('CANCELED');
    expect(row.mealCount).toBe(0);
    expect(row.total).toBe(0);
  });
});
