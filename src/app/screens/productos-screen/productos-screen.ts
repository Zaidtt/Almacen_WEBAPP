import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { LicorService } from '../../services/licor.service';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { FacadeService } from '../../services/facade.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';


// Define la interfaz Licor según tu modelo Django
export interface Licor {
  id: number;
  nombre: string;
  marca: string;
  tipo: string;
  categoria: string;
  origen: string;
  sabor: string;
  volumen_ml: number;
  articulos_por_unidad: number;
  fecha_entrada: string;
  caducidad: string;
  lote: string;
  descripcion: string;
  imagen: string;
  precio: number;
  disponible: boolean;
  creado: string;
  actualizado: string;
}

@Component({
  selector: 'app-productos-screen',
  templateUrl: './productos-screen.html',
  styleUrls: ['./productos-screen.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, NavbarComponent,MatTabsModule ],
})
export class ProductosScreen implements OnInit {
  // Estado y datos usados por la búsqueda / UI
  public licores: any[] = [];
  public loading = false;
  public error: string | null = null;
  public searchQuery: string | null = null;

  // Propiedades añadidas para evitar errores TS: categorías, almacen por categoría y próximos a vencer
  public categorias: string[] = [];
  public almacen: Record<string, Licor[]> = {};
  public proximosAVencer: Licor[] = [];

  carouselIndex = 0;
  carruselImagenes = [
    '/assets/images/carrusel/almacen.jpg',
    '/assets/images/carrusel/tquilas.png',
    '/assets/images/carrusel/wiskey.png',
  ];

  private backendUrl: string = 'http://127.0.0.1:8000'; // Ajusta según tu backend

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licorService: LicorService
  ) {}

  ngOnInit(): void {
    // Si venimos con ?caducidad=1 hacemos scroll al bloque "próximos a caducar"
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('caducidad')) {
        // pequeño timeout para esperar render
        setTimeout(() => {
          const el = document.getElementById('proximos-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
      }
    } catch (e) {
      // noop
    }

    setInterval(() => {
    this.carouselIndex = (this.carouselIndex + 1) % this.carruselImagenes.length;
  }, 4000);

    // manejar query param de búsqueda
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q');
      this.searchQuery = q ? q : null;
      if (this.searchQuery) {
        this.cargarPorQuery(this.searchQuery);
      } else {
        // comportamiento normal: cargar proximos / almacen (ya implementado)
        this.cargarLicores(); // o el método que ya uses para mostrar inicio
      }
    });
  }

  private cargarLicores(): void {
  this.licorService.obtenerListaLicores().subscribe({
    next: (licores: Licor[]) => {
      // Asegurarte de que cada licor tenga la URL correcta de la imagen
      this.licores = licores.map(l => ({
        ...l,
        imagen: l.imagen
          ? l.imagen.startsWith('http://') || l.imagen.startsWith('https://')
            ? l.imagen
            : `http://127.0.0.1:8000/media/${l.imagen}`
          : 'assets/default-licor.jpg'
      }));

      // Agrupar categorías únicas
      this.categorias = Array.from(new Set(this.licores.map(l => l.categoria)));

      // Próximos a vencer: menos de 30 días
      const hoy = new Date();
      this.proximosAVencer = this.licores.filter((l: Licor) => {
        const caducidad = new Date(l.caducidad);
        const diffDias = (caducidad.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
        return diffDias >= 0 && diffDias <= 30;
      });

      // Separar por categoría
      this.categorias.forEach(cat => {
        this.almacen[cat] = this.licores.filter(l => l.categoria === cat);
      });
    },
    error: (err: any) => {
      console.error('Error al cargar licores:', err);
    }
  });
}

  private cargarPorQuery(q: string): void {
    this.loading = true;
    this.error = null;
    this.licorService.obtenerLicoresPorQuery(q).subscribe({
      next: (data: any[]) => {
        // mapear imagen si hace falta (reusar getImageUrl si existe)
        this.licores = (data || []).map(d => ({
          ...d,
          imagen: this.getImageUrl(d.imagen)
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error buscando licores:', err);
        this.error = 'Error al buscar licores.';
        this.loading = false;
      }
    });
  }

  /**
   * Normaliza la URL de la imagen. Devuelve una ruta válida o una imagen por defecto.
   * No depende de environment para evitar import adicionales en este parche.
   */
  public getImageUrl(img?: any): string {
    if (!img) return 'assets/default-licor.jpg';
    const s = img.toString();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) return s;
    // Si viene solo el nombre, devolverlo tal cual (backend relativo) o por defecto
    return s || 'assets/default-licor.jpg';
  }

  public verProducto(licor: Licor): void {
    const categoria = encodeURIComponent(licor.categoria);
    const nombre = encodeURIComponent(licor.nombre);
    this.router.navigate([`/productos/${categoria}/${nombre}`]);
  }
}
