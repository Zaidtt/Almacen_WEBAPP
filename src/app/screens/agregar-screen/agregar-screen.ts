import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LicorService } from '../../services/licor.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';


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
export class AgregarScreen {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private licorService = inject(LicorService);

  public form = this.fb.group({
    nombre: ['', Validators.required],
    marca: ['', Validators.required],
    tipo: ['', Validators.required],
    categoria: ['', Validators.required],
    origen: ['', Validators.required],
    sabor: ['', Validators.required],
    volumen_ml: [0, Validators.required],
    articulos_por_unidad: [1, Validators.required],
    fecha_entrada: ['', Validators.required],
    caducidad: ['', Validators.required],
    lote: ['', Validators.required],
    descripcion: ['', Validators.required],
    precio: [0, Validators.required],
    imagen: [null as File | null, Validators.required]
  });

  public categorias = ['Whisky', 'Tequila', 'Mezcal', 'Vodka', 'Ron', 'Cerveza'];
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
    this.form.patchValue({ imagen: file });

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
}
