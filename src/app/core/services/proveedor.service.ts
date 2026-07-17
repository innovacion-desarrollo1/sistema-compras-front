import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProveedorItem, ProveedorUpdate } from '../models/proveedor.types';

interface ProveedorListResponse {
  items: ProveedorItem[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private http = inject(HttpClient);
  private readonly base = '/api/v1/proveedores';

  getAll(): Observable<ProveedorItem[]> {
    return this.http.get<ProveedorListResponse>(this.base + '/').pipe(map(r => r.items));
  }

  update(nit: string, patch: ProveedorUpdate): Observable<ProveedorItem> {
    return this.http.patch<ProveedorItem>(`${this.base}/${nit}`, patch);
  }
}
