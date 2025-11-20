import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LicorService } from '../../services/licor.service';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';

export interface Licor {
  nombre: string;
  marca?: string;
  tipo?: string;
  categoria?: string;
  imagen?: string;
  disponible?: boolean;
}

@Component({
  selector: 'app-productos-tipo-screen',
  templateUrl: './productos-tipo-screen.html',
  styleUrls: ['./productos-tipo-screen.scss'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, MatCardModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ProductosTipoScreen implements OnInit {
  public tipo: string = '';
  public licores: Licor[] = [];
  public loading = false;
  public error: string | null = null;
  private backendUrl = environment.url_api ?? 'http://127.0.0.1:8000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licorService: LicorService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const t = params.get('tipo');
      this.tipo = t ?? '';
      if (!this.tipo) {
        this.router.navigate(['/productos']);
        return;
      }
      this.cargarPorTipo(this.tipo);
    });
  }

  private cargarPorTipo(tipo: string): void {
    this.loading = true;
    this.error = null;

    this.licorService.obtenerLicoresPorTipo(tipo).subscribe({
      next: (data: any[]) => {
        console.log('Respuesta licores por tipo (raw):', data);

        const getImageUrl = (img?: string) => {
          if (!img) return 'assets/default-licor.jpg';
          const s = img.toString();
          if (s.startsWith('http://') || s.startsWith('https://')) return s;
          // ruta absoluta en backend (/media/...)
          if (s.startsWith('/')) return `${this.backendUrl}${s}`;
          // posible nombre relativo o "media/licores/..."
          const cleaned = s.replace(/^\/?media\/licores\//, '');
          return `${this.backendUrl}/media/licores/${cleaned}`;
        };

        const mapped = data.map(d => ({
          ...d,
          imagen: getImageUrl(d.imagen)
        }));

        const tipoNorm = (tipo || '').trim().toLowerCase();
        this.licores = mapped.filter(d => {
          const vTipo = (d.tipo || '').toString().toLowerCase();
          const vCategoria = (d.categoria || '').toString().toLowerCase();
          const vNombre = (d.nombre || '').toString().toLowerCase();
          return vTipo === tipoNorm || vCategoria === tipoNorm || vTipo.includes(tipoNorm) || vCategoria.includes(tipoNorm) || vNombre.includes(tipoNorm);
        });

        console.log('Licores filtrados (cliente):', this.licores);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando licores por tipo:', err);
        this.error = `Error al cargar licores (status ${err?.status ?? 'unknown'}).`;
        this.licores = [];
        this.loading = false;
      }
    });
  }

  public verProducto(item: any): void {
    if (!item || !item.nombre) return;
    const categoria = item.categoria ? encodeURIComponent(item.categoria) : 'general';
    const nombre = encodeURIComponent(item.nombre);
    // ruta definida en app.routes: 'productos/:categoria/:nombre'
    this.router.navigate(['/productos', categoria, nombre]);
  }
}
