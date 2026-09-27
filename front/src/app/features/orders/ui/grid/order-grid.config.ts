import { type ColDef } from 'ag-grid-community';
import { MealStatus, type OrderOutputType } from 'shared';
import { OrderStatusCellComponent } from '../cells/status/order-status-cell.component';

export type OrderRow = OrderOutputType & {
  status: MealStatus | 'MIXED';
  mealCount: number;
  total: number;
  createdAt: Date;
};

export const ORDER_STATUS_LABELS: Record<OrderRow['status'], string> = {
  VALIDATION: 'À valider',
  IN_PROGRESS: 'En préparation',
  READY: 'Prête',
  SERVED: 'Servie',
  CANCELED: 'Annulée',
  MIXED: 'Mixte',
};

export const ORDER_GRID_COLUMNS: ColDef<OrderRow>[] = [
  { field: 'id', headerName: 'Commande', width: 125 },
  { field: 'table', headerName: 'Table', width: 105 },
  { field: 'waiterName', headerName: 'Serveur', flex: 1, minWidth: 160 },
  {
    field: 'createdAt',
    headerName: 'Créée le',
    width: 170,
    valueFormatter: ({ value }) => new Date(value).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  },
  { field: 'mealCount', headerName: 'Plats', width: 105 },
  {
    field: 'status',
    headerName: 'Statut',
    flex: 1,
    minWidth: 130,
    cellRenderer: OrderStatusCellComponent,
  },
  {
    field: 'total',
    headerName: 'Total',
    width: 125,
    valueFormatter: ({ value }) => `${Number(value).toFixed(2)} €`,
  },
];

export const ORDER_GRID_DEFAULT_COLUMN: ColDef<OrderRow> = {
  resizable: true,
  sortable: true,
  filter: true,
};

export function toOrderRow(order: OrderOutputType): OrderRow {
  const statuses = new Set(order.meals.map((meal) => meal.status));
  const status = statuses.size === 1
    ? [...statuses][0]
    : statuses.size > 1
      ? 'MIXED'
      : 'CANCELED';
  const createdAt = order.meals.reduce(
    (earliest, meal) => {
      const mealCreatedAt = new Date(meal.createdAt);
      return mealCreatedAt < earliest ? mealCreatedAt : earliest;
    },
    new Date(order.meals[0].createdAt),
  );

  return {
    ...order,
    status,
    mealCount: order.meals.reduce((count, meal) => count + meal.quantity, 0),
    total: order.meals.reduce((total, meal) => total + meal.price * meal.quantity, 0),
    createdAt,
  };
}
