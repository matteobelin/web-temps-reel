import { Component } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import type { OrderRow } from '../../grid/order-grid.config';

type OrderActionParams = ICellRendererParams<OrderRow> & {
  label: string;
  canAdvance: (order: OrderRow) => boolean;
  onAdvance: (order: OrderRow) => void;
};

@Component({
  selector: 'app-order-action-cell',
  standalone: true,
  templateUrl: './order-action-cell.component.html',
  styleUrl: './order-action-cell.component.scss',
})
export class OrderActionCellComponent implements ICellRendererAngularComp {
  order: OrderRow | undefined;
  label = '';
  canAdvance!: (order: OrderRow) => boolean;
  private onAdvance!: (order: OrderRow) => void;

  agInit(params: OrderActionParams): void {
    this.setParams(params);
  }

  refresh(params: OrderActionParams): boolean {
    this.setParams(params);
    return true;
  }

  advance(event: Event): void {
    event.stopPropagation();
    if (this.order && this.canAdvance(this.order)) {
      this.onAdvance(this.order);
    }
  }

  private setParams(params: OrderActionParams): void {
    this.order = params.data;
    this.label = params.label;
    this.canAdvance = params.canAdvance;
    this.onAdvance = params.onAdvance;
  }
}
