import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { LicorService } from '../../services/licor.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'licor-agregar-screen',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    NavbarComponent
  ],
  templateUrl: './agregar-screen.html',
  styleUrls: ['./agregar-screen.scss']
})
export class AgregarScreen implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private licorService = inject(LicorService);
  private route = inject(ActivatedRoute);

  public form = this.fb.group({
    nombre: ['', [Validators.required]],
    marca: ['', [Validators.required]],
    tipo: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
    categoria: ['', [Validators.required]],
    origen: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
    sabor: ['', [Validators.required]],
    volumen_ml: [null, [Validators.required, Validators.min(1)]],
    articulos_por_unidad: [1, [Validators.required, Validators.min(1)]],
    fecha_entrada: ['', [Validators.required]],
    caducidad: [''],
    lote: [''],
    descripcion: [''],
    precio: [null, [Validators.required, Validators.min(0)]],
    imagen: [null as File | null]
  }, { validators: this.caducidadPosteriorValidator.bind(this) });

  public categorias = ['Whisky', 'Tequila', 'Mezcal', 'Vodka', 'Ron', 'Cerveza', 'Vino', 'Brandy'];
  public preview: string | ArrayBuffer | null = null;

  @ViewChild('imagenInput') imagenInput!: ElementRef<HTMLInputElement>;

  public abrirSelectorImagen(): void {
    this.imagenInput.nativeElement.click();
  }

  // Selector de imagen con preview
  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file) {
      // usar setValue en el control para evitar error de tipado estricto con patchValue
      this.form.get('imagen')?.setValue(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.preview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Guardar licor
  public guardar(): void {
    if (this.form.invalid) return;

    const formData = new FormData();
    const value = this.form.value as any;

    Object.keys(this.form.controls).forEach(key => {
      if (key === 'imagen') {
        const file = value[key];
        if (file) formData.append('imagen', file);
      } else if (key === 'articulos_por_unidad' || key === 'volumen_ml' || key === 'precio') {
        formData.append(key, value[key]?.toString() || '0');
      } else {
        formData.append(key, value[key] || '');
      }
    });

    // disponible se asigna automáticamente
    formData.append('disponible', 'true');

    this.licorService.create(formData).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (err: HttpErrorResponse) => console.error('Error al guardar licor:', err)
    });
  }

  // Cancelar y volver a productos
  public cancelar(): void {
    this.router.navigate(['/productos']);
  }

  // --- Edición: propiedades y ciclo de vida ---
  public isEdit = false;
  public editingNombre: string | null = null;
  public titulo = 'Agregar producto nuevo';

  ngOnInit(): void {
    // Suscribirse siempre para auto-generar lote tanto en Agregar como Editar
    this.form.valueChanges.subscribe(() => {
      this.updateLoteFromFields();
    });

    const nombre = this.route.snapshot.paramMap.get('nombre');
    console.log('[AgregarScreen] ngOnInit nombreParam=', nombre);
    if (!nombre) return;

    this.isEdit = true;
    this.editingNombre = nombre;
    this.titulo = `Editar — ${nombre}`;

    // Usar la misma API que ProductoScreen
    this.licorService.obtenerLicorPorNombre(nombre).subscribe({
      next: (p: any) => {
        console.log('[AgregarScreen] obtenerLicorPorNombre response:', p);
        const producto = Array.isArray(p) ? p[0] : p;
        if (producto) {
          this.patchFormFromProducto(producto);
          if (producto?.marca) { this.titulo = `Editar — ${producto.marca}`; }
          // forzar cálculo de lote inmediatamente tras rellenar form en edición
          this.updateLoteFromFields();
        } else {
          console.warn('[AgregarScreen] no se encontró producto con ese nombre:', nombre);
        }
      },
      error: (err: any) => {
        console.error('Error cargar por nombre', err);
      }
    });
  }

  private patchFormFromProducto(p: any) {
    if (!p) {
      console.warn('[AgregarScreen] patchFormFromProducto: producto vacío', p);
      return;
    }
    console.log('[AgregarScreen] patchFormFromProducto rellenando form con:', p);

    // actualizar controles no fecha con patchValue (cast any para evitar comprobación estricta)
    this.form.patchValue({
      nombre: p.nombre ?? '',
      marca: p.marca ?? '',
      tipo: p.tipo ?? '',
      categoria: p.categoria ?? '',
      origen: p.origen ?? '',
      sabor: p.sabor ?? '',
      volumen_ml: p.volumen ?? p.volumen_ml ?? null,
      articulos_por_unidad: p.articulos_por_unidad ?? p.articulos ?? null,
      lote: p.lote ?? '',
      descripcion: p.descripcion ?? '',
      precio: p.precio ?? null
    } as any);

    // fechas: setValue por separado para evitar incompatibilidades de tipos
    const fechaEntrada = p.fecha_entrada ? new Date(p.fecha_entrada).toISOString().slice(0,10) : null;
    this.form.get('fecha_entrada')?.setValue(fechaEntrada as any);
    const caducidad = p.caducidad ? new Date(p.caducidad).toISOString().slice(0,10) : null;
    this.form.get('caducidad')?.setValue(caducidad as any);

     // preview si hay imagen (opcional)
     if (p.imagen) {
       // p.imagen puede ser URL o base64
       this.preview = p.imagen;
      // no forzamos el control 'imagen' con la URL; dejarlo solo para upload de File
     }
   }

   private caducidadPosteriorValidator(group: AbstractControl): ValidationErrors | null {
    const fechaVal = group.get('fecha_entrada')?.value;
    const cadVal = group.get('caducidad')?.value;

    // si no hay caducidad definida no hay error
    if (!cadVal) {
      // limpiar posible error previo
      const cadCtrl = group.get('caducidad');
      if (cadCtrl?.hasError && cadCtrl?.hasError('caducidadAntes')) cadCtrl.setErrors(null);
      return null;
    }

    // convertir a Date (acepta strings en formato yyyy-MM-dd)
    const fecha = fechaVal ? new Date(fechaVal) : null;
    const caducidad = new Date(cadVal);

    if (fecha && caducidad < fecha) {
      // marcar error en el control caducidad para mostrar mensaje en plantilla
      group.get('caducidad')?.setErrors({ caducidadAntes: true });
      return { caducidadAntes: true };
    }

    // si ya existía el error, limpiarlo
    const cadCtrl = group.get('caducidad');
    if (cadCtrl?.hasError && cadCtrl?.hasError('caducidadAntes')) {
      cadCtrl.setErrors(null);
    }

    return null;
  }

  private twoDigitMonthYearFromDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    // aceptar formato yyyy-mm-dd
    try {
      const y = dateStr.substr(0,4);
      const m = dateStr.substr(5,2);
      if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(m)) return null;
      const yy = y.substr(2,2);
      return `${m}${yy}`;
    } catch {
      return null;
    }
  }

  private normalizeLetters(s: any, count = 1): string {
    if (!s && s !== 0) return ''.padEnd(count, 'X');
    const str = String(s).trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ]/g, '');
    if (!str) return ''.padEnd(count, 'X');
    return (str + ''.padEnd(count)).substr(0, count);
  }

  private updateLoteFromFields(): void {
    const nombre = this.form.get('nombre')?.value;
    const marca = this.form.get('marca')?.value;
    const tipo = this.form.get('tipo')?.value;
    const origen = this.form.get('origen')?.value;
    const fechaEntrada = this.form.get('fecha_entrada')?.value;
    const caducidad = this.form.get('caducidad')?.value;

    const a = this.normalizeLetters(nombre, 1);
    const b = this.normalizeLetters(marca, 1);
    const fe = this.twoDigitMonthYearFromDate(fechaEntrada) ?? '0000';
    const t = this.normalizeLetters(tipo, 1);
    const o = this.normalizeLetters(origen, 2);
    const fc = this.twoDigitMonthYearFromDate(caducidad) ?? '0000';

    const lote = `${a}${b}${fe}${t}${o}${fc}`;
    // setValue sin emitir evento para evitar loop
    this.form.get('lote')?.setValue(lote, { emitEvent: false });
  }
}
