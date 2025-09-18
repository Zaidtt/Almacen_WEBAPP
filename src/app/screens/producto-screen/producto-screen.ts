import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicorService } from '../../services/licor.service';
import { FacadeService } from '../../services/facade.service';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { MatDialog } from '@angular/material/dialog';
import { EliminarLicorModalComponent } from '../../modals/eliminar-licor-modal/eliminar-licor-modal';

export interface Licor {
  nombre: string;
  marca: string;
  tipo: string;
  categoria: string;
  origen?: string;
  sabor?: string;
  volumen?: number;
  articulos?: number;
  fecha_entrada?: string;
  caducidad?: string;
  lote?: string;
  descripcion?: string;
  imagen: string;
  precio?: number;
  disponible: boolean;
}

@Component({
  selector: 'app-producto-screen',
  templateUrl: './producto-screen.html',
  styleUrls: ['./producto-screen.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, EliminarLicorModalComponent ],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ProductoScreen implements OnInit {
  public producto!: Licor;
  public cantidad: number = 1;
  private backendUrl: string = 'http://127.0.0.1:8000'; // Ajusta según tu backend

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licorService: LicorService,
    private facadeService: FacadeService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarProducto();
  }

  private cargarProducto(): void {
    const nombreParam = this.route.snapshot.paramMap.get('nombre');
    if (!nombreParam) {
      console.error('No se proporcionó nombre del producto');
      return;
    }

    // Solo decodificamos espacios correctamente
    const nombre = decodeURIComponent(nombreParam.replace(/\+/g, ' '));

    this.licorService.obtenerLicorPorNombre(nombre).subscribe({
      next: (data: any) => {
        console.log('Licor recibido desde backend:', data);

        if (data) {
          const imagenLimpia = data.imagen?.replace(/^\/?media\/licores\//, '');

          this.producto = {
            ...data,
            volumen: data.volumen_ml ?? data.volumen, // mapeo
            articulos: data.articulos_por_unidad ?? data.articulos, // mapeo
            imagen: data.imagen
              ? `${this.backendUrl}/media/licores/${imagenLimpia}`
              : 'assets/default-licor.jpg'
          };
        } else {
          console.warn('No se encontró el licor con ese nombre');
          this.router.navigate(['/']); // redirige si no se encuentra
        }
      },
      error: (err) => {
        console.error('Error al cargar producto:', err);
        this.router.navigate(['/']); // redirige si hay error
      }
    });
  }

  public formatearDescripcion(desc?: string): string {
    return desc ? desc.replace(/\n/g, '\n') : '';
  }

  public home(): void {
    this.router.navigate(['/']);
  }

  public Agregar(): void {
    this.router.navigate(['/agregar-licor']);
  }

  public logout(): void {
    this.facadeService.logout();
    this.router.navigate(['/login']);
  }

  public editarProducto(): void {
    if (this.producto)
      this.router.navigate([`/editar-licor/${encodeURIComponent(this.producto.nombre)}`]);
  }



    public eliminarProducto(): void {
    if (!this.producto) return;

    const dialogRef = this.dialog.open(EliminarLicorModalComponent, {
      data: { nombre: this.producto.nombre },
      width: '380px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.isDelete) {
        alert('Producto eliminado');
        this.router.navigate(['/productos']);
      } else {
        // no eliminado o cancelado
      }
    });

  }

  public abrirModalEliminar(): void {
  const modal = document.querySelector('.wrapper') as HTMLElement;
  if (modal) {
    modal.style.display = 'block';
  }
}

}
