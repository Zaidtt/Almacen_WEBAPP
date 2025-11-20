import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { LicorService } from '../../services/licor.service';

import { of } from 'rxjs';

@Component({
  selector: 'app-productos-buscar-screen',
  templateUrl: './productos-buscar-screen.html',
  styleUrls: ['./productos-buscar-screen.scss'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, MatCardModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ProductosBuscarScreen implements OnInit {
  public q: string | null = null;
  public licores: any[] = [];
  public loading = false;
  public error: string | null = null;
  public query: string = '';
  public productos: any[] = [];
  public resultados: any[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private licorService: LicorService) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q');
      this.q = q ? q : null;
      if (this.q) this.buscar(this.q);
    });
  }

  private buscar(q: string) {
    this.loading = true; this.error = null;
    this.licorService.obtenerLicoresPorQuery(q).subscribe({
      next: (data: any[]) => { this.licores = (data || []); this.loading = false; },
      error: (err) => { console.error(err); this.error = 'Error al buscar'; this.loading = false; }
    });
  }

  private isNumericOnly(s: string): boolean {
    return /^\d+$/.test(s);
  }

  private loadAndFilter(): void {
    // intentar usar licorService para obtener la lista; soporta varias APIs según disponible
    const source$ = (typeof (this.licorService as any).listarTodos === 'function')
      ? (this.licorService as any).listarTodos()
      : (typeof (this.licorService as any).obtenerLicoresPorQuery === 'function')
        ? (this.licorService as any).obtenerLicoresPorQuery('')
        : of([]);

    source$.subscribe((list: any[]) => {
      this.productos = Array.isArray(list) ? list : [];
      if (!this.query) {
        this.resultados = this.productos;
        return;
      }

      const q = this.query;
      if (this.isNumericOnly(q)) {
        // búsqueda numérica: comparar con id y campos numéricos exactos/contiene
        this.resultados = this.productos.filter(p => {
          const idMatch = String(p.id ?? '').includes(q);
          const stockMatch = String(p.articulos_por_unidad ?? '').includes(q);
          const volumenMatch = String(p.volumen_ml ?? '').includes(q);
          const precioMatch = String(p.precio ?? '').includes(q);
          // incluir también lote/códigos que sean numéricos
          const loteMatch = String(p.lote ?? '').includes(q);
          return idMatch || stockMatch || volumenMatch || precioMatch || loteMatch;
        });
      } else {
        const ql = q.toLowerCase();
        this.resultados = this.productos.filter(p => {
          return (
            String(p.nombre ?? '').toLowerCase().includes(ql) ||
            String(p.marca ?? '').toLowerCase().includes(ql) ||
            String(p.tipo ?? '').toLowerCase().includes(ql) ||
            String(p.origen ?? '').toLowerCase().includes(ql) ||
            String(p.descripcion ?? '').toLowerCase().includes(ql)
          );
        });
      }
    }, (err: any) => {
      console.error('Error cargar productos para búsqueda', err);
      this.resultados = [];
    });
  }

  public verProducto(item: any) {
    if (!item || !item.nombre) return;
    const categoria = item.categoria ? encodeURIComponent(item.categoria) : 'general';
    const nombre = encodeURIComponent(item.nombre);
    this.router.navigate(['/productos', categoria, nombre]);
  }
}
