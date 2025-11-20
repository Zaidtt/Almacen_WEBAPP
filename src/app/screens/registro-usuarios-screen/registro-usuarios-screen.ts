import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpleadosService } from '../../services/empleados.service';
import { AdministradoresService } from '../../services/administradores.service';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-registro-usuarios-screen',
  templateUrl: './registro-usuarios-screen.html',
  styleUrls: ['./registro-usuarios-screen.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,   // <= asegurarse presente
    MatRadioModule,
    MatIconModule      // <= asegurarse presente
  ]
})
export class RegistroUsuariosScreenComponent implements OnInit {
  public user: any = {};
  public tipo_user: string | null = null;
  public isAdmin = false;
  public isEmpleado = false;

  // mostrar/ocultar contraseña
  public showPassword = false;
  public showConfirmPassword = false;
  public togglePassword(): void { this.showPassword = !this.showPassword; }
  public toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  // retorna true si las contraseñas existen y no coinciden (para lógica adicional)
  public passwordMismatch(): boolean {
    return !!(this.user?.password && this.user?.confirmPassword && this.user.password !== this.user.confirmPassword);
  }

  // llamado en blur / input de las contraseñas para forzar validación:
  public onPasswordChange(form?: NgForm): void {
    if (!form) return;

    const passNg = form.controls?.['password'] as any;
    const confNg = form.controls?.['confirmPassword'] as any;
    const passVal = this.user?.password ?? '';
    const confVal = this.user?.confirmPassword ?? '';

    // si existe el control reactivo subyacente (NgModel.control -> FormControl) manipulamos errores
    if (confNg?.control) {
      if (passVal && confVal && passVal !== confVal) {
        // añadir error mismatch preservando otros errores
        const errs = { ...(confNg.control.errors || {}), mismatch: true };
        confNg.control.setErrors(errs);
      } else {
        // eliminar mismatch sin tocar otros errores
        if (confNg.control.errors) {
          const e = { ...confNg.control.errors };
          delete e['mismatch'];
          confNg.control.setErrors(Object.keys(e).length ? e : null);
        }
      }
      confNg.control.markAsTouched();
    }

    if (passNg?.control) passNg.control.markAsTouched();
  }

  // asegurar que telefono solo acepte dígitos y máximo 10 caracteres
  public onlyDigits(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const cleaned = input.value.replace(/\D+/g, '').slice(0, 10);
    input.value = cleaned;
    // si usas ngModel sincronizar manualmente
    this.user = this.user || {};
    this.user.telefono = cleaned;
  }

  public isUpdate: boolean = false;
  public errors: any = {};
  public rol: string = "";
  public idUser: number = 0;
  public editar: boolean = false;
  public form: FormGroup;

  constructor(
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private router: Router,
    private administradoresService: AdministradoresService,
    private empleadosService: EmpleadosService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8),
        // al menos una mayúscula, una minúscula y un dígito
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      // campos admin
      clave_admin: [''],
      rfc: ['', [Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i)]],
      edad: [null, [Validators.min(18), Validators.max(120)]],
      ocupacion: [''],
      // campos empleado
      clave_empleado: [''],
      puesto: [''],
      telefono: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]],
      fecha_ingreso: ['', [this.notFutureDateValidator]],
    }, { validators: this.passwordsMatchValidator, updateOn: 'blur' });
  }

  ngOnInit() {
    if (this.activatedRoute.snapshot.params['rol'] != undefined) {
      this.rol = this.activatedRoute.snapshot.params['rol'];
      console.log("Rol detectado: ", this.rol);
    }

    if (this.activatedRoute.snapshot.params['id'] != undefined) {
      this.idUser = this.activatedRoute.snapshot.params['id'];
      console.log("ID User: ", this.idUser);
      this.obtenerUserByID();
    }
  }

  public obtenerUserByID() {
    if (this.rol === "administrador") {
      this.administradoresService.getAdminByID(this.idUser).subscribe(
        (response) => {
          this.user = response;
          this.user.first_name = response.user.first_name;
          this.user.last_name = response.user.last_name;
          this.user.email = response.user.email;
          this.user.tipo_usuario = this.rol;
          this.isAdmin = true;
          console.log("Datos admin: ", this.user);
        },
        (error) => {
          alert("No se pudieron obtener los datos del administrador para editar");
        }
      );
    } else if (this.rol === "empleado") {
      this.empleadosService.getEmpleadoByID(this.idUser).subscribe(
        (response) => {
          this.user = response;
          this.user.first_name = response.user.first_name;
          this.user.last_name = response.user.last_name;
          this.user.email = response.user.email;
          this.user.tipo_usuario = this.rol;
          this.isEmpleado = true;
          console.log("Datos empleado: ", this.user);
        },
        (error) => {
          alert("No se pudieron obtener los datos del empleado para editar");
        }
      );
    }
  }

  public radioChange(event: any): void {
    this.tipo_user = event.value;
    this.isAdmin = this.tipo_user === 'administrador';
    this.isEmpleado = this.tipo_user === 'empleado';
  }

  // Validación: password y confirm deben coincidir
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    if (p && c && p !== c) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { passwordsMismatch: true };
    }
    // limpiar mismatch si ya no aplica
    if (group.get('confirmPassword')?.hasError('mismatch')) {
      group.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  // Validación: fecha no puede ser futura
  private notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (!v) return null;
    const d = new Date(v);
    const today = new Date(); today.setHours(0,0,0,0);
    if (isNaN(d.getTime())) return { invalidDate: true };
    if (d > today) return { futureDate: true };
    return null;
  }

  public registrar(): void {
    // verificar manualmente antes de enviar
    if (this.passwordMismatch()) return;

    this.errors = {};

    if (this.tipo_user === 'empleado') {
      const errores = this.empleadosService.validarEmpleado(this.user, this.editar);
      if (Object.keys(errores).length > 0) {
        this.errors = errores;
        console.log('Errores de validación (empleado):', errores);
        return;
      }

      const payload = {
        email: this.user.email,
        password: this.user.password,
        first_name: this.user.nombre || this.user.first_name || '',
        last_name: this.user.apellido || this.user.last_name || '',
        rol: 'empleado',
        clave_empleado: this.user.clave_empleado || '',
        telefono: this.user.telefono || '',
        puesto: this.user.puesto || 'General',
        fecha_ingreso: this.user.fecha_ingreso || new Date().toISOString().split('T')[0]
      };

      console.log('Validando empleado...', this.user);
      console.log('Payload enviado a backend (empleado):', payload);

      this.empleadosService.registrarEmpleado(payload).subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);
          alert('Empleado registrado con éxito');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error al registrar empleado:', err);
          alert(`Error al registrar empleado: ${err.status} - ${JSON.stringify(err.error)}`);
        }
      });
    } else if (this.tipo_user === 'administrador') {
      const errores = this.administradoresService.validarAdmin(this.user, this.editar);
      if (Object.keys(errores).length > 0) {
        this.errors = errores;
        console.log('Errores de validación (admin):', errores);
        return;
      }

      const payload = {
        email: this.user.email,
        password: this.user.password,
        first_name: this.user.nombre || this.user.first_name || '',
        last_name: this.user.apellido || this.user.last_name || '',
        rol: 'administrador',
        clave_admin: this.user.clave_admin || '',
        telefono: this.user.telefono || '',
        rfc: this.user.rfc || '',
        edad: this.user.edad || null,
        ocupacion: this.user.ocupacion || ''
      };

      console.log('Validando administrador...', this.user);
      console.log('Payload enviado a backend (admin):', payload);

      this.administradoresService.registrarAdmin(payload).subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);
          alert('Administrador registrado con éxito');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error al registrar administrador:', err);
          alert(`Error al registrar administrador: ${err.status} - ${JSON.stringify(err.error)}`);
        }
      });
    } else {
      console.log('Error: tipo_user no seleccionado');
      alert('Por favor selecciona un tipo de usuario (Administrador o Empleado)');
    }
  }

  public regresar(): void {
    this.location.back();
  }

  // utilitario para template
  public control(name: string) { return this.form.get(name); }

  // marca como touched el control template-driven (usado desde la plantilla en blur)
  public markTouched(controlName: string, form?: NgForm): void {
    if (!form || !form.controls) return;
    const ctrl = form.controls[controlName] as any;
    // NgModel exposes .control (FormControl) en control.control
    if (ctrl?.control?.markAsTouched) {
      ctrl.control.markAsTouched();
    } else if (ctrl?.markAsTouched) {
      // fallback directo sobre el NgModel
      ctrl.markAsTouched();
    }
  }
}
