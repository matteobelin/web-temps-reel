import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/data-access/auth.service';
import { OrdersService } from '../data-access/orders.service';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type RowClickedEvent,
} from 'ag-grid-community';
import { MealStatus, type MealStatus as MealStatusType, type OrderInputType } from 'shared';
import {
  ORDER_GRID_COLUMNS,
  ORDER_GRID_DEFAULT_COLUMN,
  type OrderRow,
  toOrderRow,
} from '../ui/grid/order-grid.config';
import { OrderActionCellComponent } from '../ui/cells/action/order-action-cell.component';
import { ToastService } from '../../../core/ui/toast/toast.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-orders-page',
  imports: [AgGridAngular, FormsModule, OrderActionCellComponent],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
})
export class OrdersPageComponent {
  readonly auth = inject(AuthService);
  private readonly ordersService = inject(OrdersService);
  private readonly toast = inject(ToastService);

  readonly columnDefs: ColDef<OrderRow>[] = [
    ...ORDER_GRID_COLUMNS
      .filter((column) => column.field !== 'id')
      .sort((left, right) => Number(right.field === 'status') - Number(left.field === 'status')),
    {
      headerName: 'Action',
      width: 125,
      sortable: false,
      filter: false,
      cellRenderer: OrderActionCellComponent,
      cellRendererParams: {
        label: this.advanceLabel(),
        canAdvance: (order: OrderRow) => this.canAdvance(order),
        onAdvance: (order: OrderRow) => this.advanceOrder(order),
      },
    },
  ];
  readonly defaultColDef = ORDER_GRID_DEFAULT_COLUMN;
  readonly gridLocaleText = {
    noRowsToShow: 'Aucune commande à traiter',
  };
  readonly gridTheme = themeQuartz.withParams({
    accentColor: '#16806b',
    backgroundColor: '#ffffff',
    borderColor: '#e1ebe7',
    browserColorScheme: 'light',
    chromeBackgroundColor: '#f7faf9',
    fontFamily: 'Inter, system-ui, sans-serif',
    foregroundColor: '#27453e',
    headerBackgroundColor: '#edf3f0',
    headerFontWeight: 700,
    rowHoverColor: '#f3f8f5',
    selectedRowBackgroundColor: '#e1f2eb',
  });
  readonly orders = signal<OrderRow[]>([]);
  readonly selectedOrder = signal<OrderRow | null>(null);
  readonly activeFilter = signal<'all' | 'validation' | 'canceled'>('all');
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isUpdating = signal(false);
  readonly newTable = signal('');
  readonly newQuantity = signal('1');
  readonly newPrice = signal('');
  readonly newComment = signal('');
  readonly isCreating = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  readonly visibleOrders = computed(() => {
    const orders = this.orders();
    const filteredOrders = (() => {
      switch (this.activeFilter()) {
        case 'validation':
          return orders.filter((order) =>
            order.meals.some((meal) => meal.status === MealStatus.VALIDATION),
          );
        case 'canceled':
          return orders.filter((order) =>
            order.meals.some((meal) => meal.status === MealStatus.CANCELED),
          );
        default:
          return orders;
      }
    })();

    const role = this.auth.currentUser()?.role;
    if (role === 'MANAGER' && this.activeFilter() === 'all') {
      const statusOrder: Record<OrderRow['status'], number> = {
        VALIDATION: 0,
        IN_PROGRESS: 1,
        READY: 2,
        SERVED: 3,
        CANCELED: 4,
        MIXED: 5,
      };
      return [...filteredOrders].sort((left, right) =>
        statusOrder[left.status] - statusOrder[right.status]
        || left.createdAt.getTime() - right.createdAt.getTime(),
      );
    }

    return [...filteredOrders].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );
  });

  constructor() {
    this.loadOrders();
    this.connectToOrderEvents();
  }

  advanceOrder(order = this.selectedOrder()): void {
    if (!order || !this.canAdvance(order) || this.isUpdating()) {
      return;
    }

    this.isUpdating.set(true);
    this.ordersService.advanceOrder(order.id).subscribe({
      next: (updated) => {
        this.applyOrderUpdate(updated);
        this.toast.success('La commande a été avancée avec succès.');
        this.isUpdating.set(false);
      },
      error: () => {
        this.toast.error("Impossible d'avancer cette commande.");
        this.isUpdating.set(false);
      },
    });
  }

  cancelOrder(): void {
    const order = this.selectedOrder();
    if (!order || this.isUpdating()) {
      return;
    }

    this.isUpdating.set(true);
    this.ordersService.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.applyOrderUpdate(updated);
        this.toast.success('La commande a été annulée avec succès.');
        this.isUpdating.set(false);
      },
      error: () => {
        this.toast.error("Impossible d'annuler cette commande.");
        this.isUpdating.set(false);
      },
    });
  }

  createOrder(): void {
    const table = Number(this.newTable());
    const quantity = Number(this.newQuantity());
    const price = Number(this.newPrice());
    if (!Number.isInteger(table) || table <= 0 || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0 || this.isCreating()) {
      this.toast.error('Indiquez une table, une quantité et un prix valides.');
      return;
    }

    const order: OrderInputType = {
      table,
      meals: [{ quantity, price, comment: this.newComment().trim() || undefined }],
    };
    this.isCreating.set(true);
    this.ordersService.createOrder(order).subscribe({
      next: () => {
        this.newTable.set('');
        this.newQuantity.set('1');
        this.newPrice.set('');
        this.newComment.set('');
        this.toast.success('Commande créée et envoyée en cuisine.');
        this.isCreating.set(false);
      },
      error: () => {
        this.toast.error('Impossible de créer la commande.');
        this.isCreating.set(false);
      },
    });
  }

  canAdvance(order: OrderRow): boolean {
    const role = this.auth.currentUser()?.role;
    const expectedStatus = role === 'MANAGER'
      ? MealStatus.VALIDATION
      : role === 'COOK'
        ? MealStatus.IN_PROGRESS
        : MealStatus.READY;
    return order.meals.some((meal) => meal.status === expectedStatus);
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.ordersService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders.map(toOrderRow));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les commandes.');
        this.toast.error('Impossible de charger les commandes.');
        this.isLoading.set(false);
      },
    });
  }

  selectOrder(order: OrderRow): void {
    this.selectedOrder.set(order);
  }

  onRowClicked(event: RowClickedEvent<OrderRow>): void {
    const target = event.event?.target;
    if (target instanceof HTMLElement && target.closest('.order-action')) {
      return;
    }

    if (event.data) {
      this.selectOrder(event.data);
    }
  }

  setFilter(filter: 'all' | 'validation' | 'canceled'): void {
    this.activeFilter.set(filter);
    this.selectedOrder.set(null);
  }

  mealStatusLabel(status: MealStatusType): string {
    return status.replace('_', ' ');
  }

  advanceLabel(): string {
    switch (this.auth.currentUser()?.role) {
      case 'MANAGER':
        return 'Valider';
      case 'COOK':
        return 'Marquer prête';
      case 'WAITER':
        return 'Servir';
      default:
        return 'Avancer';
    }
  }

  private applyOrderUpdate(order: Parameters<typeof toOrderRow>[0]): void {
    const role = this.auth.currentUser()?.role;
    const visibleMeals = role === 'MANAGER'
      ? order.meals
      : order.meals.filter((meal) =>
        role === 'COOK'
          ? meal.status === MealStatus.IN_PROGRESS
          : meal.status === MealStatus.READY,
      );
    const nextOrders = this.orders().filter((item) => item.id !== order.id);
    if (visibleMeals.length > 0 || role === 'MANAGER') {
      nextOrders.push(toOrderRow({ ...order, meals: visibleMeals }));
    }
    this.orders.set(nextOrders);

    if (this.selectedOrder()?.id === order.id) {
      this.selectedOrder.set(nextOrders.find((item) => item.id === order.id) ?? null);
    }
  }

  private connectToOrderEvents(): void {
    this.ordersService.orderEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => this.applyOrderUpdate(order),
        error: () => {
          this.loadOrders();
          setTimeout(() => this.connectToOrderEvents(), 5000);
        },
      });
  }
}
