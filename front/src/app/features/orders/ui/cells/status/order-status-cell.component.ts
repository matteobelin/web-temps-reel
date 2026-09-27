import { Component } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import type { OrderRow } from '../../grid/order-grid.config';

const ORDER_STATUS_LABELS: Record<OrderRow['status'], string> = {
  VALIDATION: 'À valider',
  IN_PROGRESS: 'En préparation',
  READY: 'Prête',
  SERVED: 'Servie',
  CANCELED: 'Annulée',
  MIXED: 'Mixte',
};

@Component({
  selector: 'app-order-status-cell',
  standalone: true,
  templateUrl: './order-status-cell.component.html',
  styleUrl: './order-status-cell.component.scss',
})
export class OrderStatusCellComponent implements ICellRendererAngularComp {
  status: OrderRow['status'] = 'MIXED';
  label = ORDER_STATUS_LABELS.MIXED;

  agInit(params: ICellRendererParams<OrderRow>): void {
    this.setValue(params);
  }

  refresh(params: ICellRendererParams<OrderRow>): boolean {
    this.setValue(params);
    return true;
  }

  private setValue(params: ICellRendererParams<OrderRow>): void {
    this.status = params.value as OrderRow['status'];
    this.label = ORDER_STATUS_LABELS[this.status];
  }
}
