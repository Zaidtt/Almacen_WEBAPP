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
  caducidad: string; // fecha_caducidad en el backend
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
  public licores: Licor[] = [];
  public proximosAVencer: Licor[] = [];
  public categorias: string[] = [];
  public almacen: { [categoria: string]: Licor[] } = {};
  public rol: string = '';

  carouselIndex = 0;
carruselImagenes = [
  '/assets/images/carrusel/almacen.jpg',
  '/assets/images/carrusel/tquilas.png',
  '/assets/images/carrusel/wiskey.png',
];

  private backendUrl: string = 'http://127.0.0.1:8000'; // Ajusta según tu backend


  constructor(
    private router: Router,
    private licorService: LicorService,
    private facadeService: FacadeService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    setInterval(() => {
    this.carouselIndex = (this.carouselIndex + 1) % this.carruselImagenes.length;
  }, 4000);

    this.cargarLicores();
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



  public verProducto(licor: Licor): void {
    const categoria = encodeURIComponent(licor.categoria);
    const nombre = encodeURIComponent(licor.nombre);
    this.router.navigate([`/productos/${categoria}/${nombre}`]);
  }
}
