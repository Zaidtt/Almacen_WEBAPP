import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicorService } from '../../services/licor.service';
import { FacadeService } from '../../services/facade.service';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { MatDialog } from '@angular/material/dialog';
import { EliminarLicorModalComponent } from '../../modals/eliminar-licor-modal/eliminar-licor-modal';
import { AgregarScreen } from '../agregar-screen/agregar-screen';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';

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
  public producto: any = null;
  public cantidadInput = 1;
  public procesando = false;
  public error: string | null = null;
  private backendUrl = environment.url_api ?? 'http://127.0.0.1:8000';

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

  // Devuelve la cantidad almacenada real (usar campo 'articulos' tal como en la plantilla)
  public get cantidadActual(): number {
    const raw = this.producto?.articulos ?? this.producto?.stock ?? this.producto?.cantidad ?? 0;
    return Number(raw) || 0;
  }

  // Asegurarse de que no exista conflicto con un método Agregar() anterior;
  // si tienes un método que navega a la pantalla de agregar, renómbralo a goToAgregar()
  public goToAgregar(): void {
    this.router.navigate(['/agregar']);
  }

  // Acción: agregar unidades (usa confirmación)
  public agregar(): void {
    this.error = null;
    const añadir = Number(this.cantidadInput) || 0;
    if (añadir <= 0) { this.error = 'Ingrese una cantidad mayor que 0'; return; }
    const nombre = this.producto?.nombre ?? '';
    const ok = window.confirm(`¿Desea agregar ${añadir} unidades al producto "${nombre}"?`);
    if (!ok) return;
    const previo = this.cantidadActual;
    const nueva = previo + añadir;
    this.persistirCantidad(nueva, previo);
  }

  // Acción: retirar unidades (usa confirmación)
  public retirar(): void {
    this.error = null;
    const restar = Number(this.cantidadInput) || 0;
    if (restar <= 0) { this.error = 'Ingrese una cantidad mayor que 0'; return; }
    const nombre = this.producto?.nombre ?? '';
    const ok = window.confirm(`¿Desea retirar ${restar} unidades del producto "${nombre}"?`);
    if (!ok) return;
    const previo = this.cantidadActual;
    let nueva = previo - restar;
    if (nueva < 0) nueva = 0;
    this.persistirCantidad(nueva, previo);
  }

  /**
   * Actualiza la cantidad en cliente y, si es posible, en backend.
   * Requiere que el campo real de almacenamiento sea 'articulos' como en la vista.
   * Si la persistencia en backend falla, revierte al valor previo y muestra alerta.
   */
  private persistirCantidad(nuevaCantidad: number, previoCantidad?: number): void {
    if (!this.producto) return;

    // Optimistic update en cliente usando el campo 'articulos'
    const prev = Number(previoCantidad ?? this.producto.articulos ?? this.producto.stock ?? 0);
    this.producto.articulos = nuevaCantidad;
    this.producto.cantidad = nuevaCantidad;
    this.producto.stock = nuevaCantidad;
    this.producto.disponible = nuevaCantidad > 0;

    // Intentar persistir en backend si el servicio trae la función correspondiente
    const svc: any = this.licorService as any;
    if (svc && typeof svc.actualizarCantidad === 'function') {
      const id = this.producto?.id ?? this.producto?.pk ?? null;
      if (!id) {
        // si no hay id, revertir y mostrar error mínimo
        console.warn('persistirCantidad: no se encontró id del producto; cambio no persistido en backend');
        this.error = 'Producto no sincronizado con backend (sin id).';
        return;
      }

      this.procesando = true;
      const nueva = Number(nuevaCantidad);
      svc.actualizarCantidad(id, { articulos_por_unidad: nueva })
        .pipe(finalize(() => { this.procesando = false; }))
        .subscribe({
          next: (resp: any) => {
            // sincronizar con respuesta del backend
            this.cargarProducto(); // recarga desde servidor
          },
          error: (err: any) => {
            console.error('Error actualizarCantidad:', err);
            // revertir el cambio optimista en cliente
            this.producto.articulos = prev;
            this.producto.cantidad = prev;
            this.producto.stock = prev;
            this.producto.disponible = prev > 0;
            this.error = 'No fue posible actualizar en el servidor.';
            alert('No fue posible actualizar en el servidor. Se revirtió el cambio.');
          }
        });
    }
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
        if (data) {
          // Normalizar y construir URL de imagen de forma robusta
          let imagenUrl = 'assets/default-licor.jpg';
          if (data.imagen) {
            const s = data.imagen.toString();
            if (s.startsWith('http://') || s.startsWith('https://')) {
              imagenUrl = s;
            } else if (s.startsWith('/')) {
              // ruta absoluta desde backend
              imagenUrl = `${this.backendUrl}${s}`;
            } else {
              // nombre o ruta relativa -> suponer media/licores
              const cleaned = s.replace(/^\/?media\/licores\/|^\/?media\/|^\//, '');
              imagenUrl = `${this.backendUrl}/media/licores/${cleaned}`;
            }
          }

          this.producto = {
            ...data,
            volumen: data.volumen_ml ?? data.volumen,
            articulos: data.articulos_por_unidad ?? data.articulos,
            imagen: imagenUrl
          };
        } else {
          console.warn('No se encontró el licor con ese nombre');
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error('Error al cargar producto:', err);
        this.router.navigate(['/']);
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
    // Navegar a la pantalla de agregar producto
    this.router.navigate(['/agregar']);
  }

  public logout(): void {
    this.facadeService.logout();
    this.router.navigate(['/login']);
  }

  editarLicor(producto: any) {
    if (!producto) return;
    const nombreParam = producto.marca || producto.nombre;
    if (!nombreParam) return;
    this.router.navigate(['/editar', nombreParam]);
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
      }
    });

  }
}
