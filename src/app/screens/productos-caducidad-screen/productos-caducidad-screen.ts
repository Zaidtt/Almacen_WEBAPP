import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { LicorService } from '../../services/licor.service';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-productos-caducidad-screen',
  templateUrl: './productos-caducidad-screen.html',
  styleUrls: ['./productos-caducidad-screen.scss'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, MatCardModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ProductosCaducidadScreen implements OnInit {
  public licores: any[] = [];
  public loading = false;
  public error: string | null = null;
  public displayDate: string | null = null; // texto que aparece junto al título
  private backendUrl = environment.url_api ?? 'http://127.0.0.1:8000';

  constructor(
    private router: Router,
    private licorService: LicorService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Si hay queryParam 'fecha' mostramos licores de esa fecha, si no mostramos proximos
    this.route.queryParamMap.subscribe(params => {
      const fecha = params.get('fecha');
      if (fecha) {
        // parsear YYYY-MM-DD como fecha LOCAL para evitar restar un día por la zona horaria
        if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          const [y, m, d] = fecha.split('-').map(n => Number(n));
          const dtLocal = new Date(y, m - 1, d);
          this.displayDate = !isNaN(dtLocal.getTime()) ? dtLocal.toLocaleDateString() : fecha;
        } else {
          // fallback genérico
          const parsed = new Date(fecha);
          this.displayDate = !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : fecha;
        }
        this.cargarPorFecha(fecha);
      } else {
        this.displayDate = null;
        this.cargarProximos();
      }
    });
  }

  private getImageUrl(img?: any): string {
    if (!img) return 'assets/default-licor.jpg';
    const s = img.toString();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) return `${this.backendUrl}${s}`;
    const cleaned = s.replace(/^\/?media\/licores\//, '');
    return `${this.backendUrl}/media/licores/${cleaned}`;
  }

  private cargarProximos(): void {
    this.loading = true;
    this.error = null;
    this.licorService.obtenerLicoresProximosACaducar().subscribe({
      next: (data: any[]) => {
        this.licores = (data || []).map(d => ({ ...d, imagen: this.getImageUrl(d.imagen) }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando próximos:', err);
        this.error = 'No se pudieron cargar los licores próximos a caducar.';
        this.loading = false;
      }
    });
  }

  private cargarPorFecha(fecha: string): void {
    this.loading = true;
    this.error = null;
    this.licorService.obtenerLicoresPorFecha(fecha).subscribe({
      next: (data: any[]) => {
        this.licores = (data || []).map(d => ({ ...d, imagen: this.getImageUrl(d.imagen) }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando licores por fecha:', err);
        this.error = 'Error al cargar licores para la fecha seleccionada.';
        this.loading = false;
      }
    });
  }

  public verProducto(item: any): void {
    if (!item || !item.nombre) return;
    const categoria = item.categoria ? encodeURIComponent(item.categoria) : 'general';
    const nombre = encodeURIComponent(item.nombre);
    this.router.navigate(['/productos', categoria, nombre]);
  }
}
