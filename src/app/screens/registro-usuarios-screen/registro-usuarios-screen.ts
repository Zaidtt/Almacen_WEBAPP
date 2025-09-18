import { Component, OnInit } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpleadosService } from '../../services/empleados.service';
import { AdministradoresService } from '../../services/administradores.service';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
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
    MatButtonModule,
    MatRadioModule
  ]
})
export class RegistroUsuariosScreenComponent implements OnInit {
  public tipo: string = "registro-usuarios";
  public user: any = {};
  public isUpdate: boolean = false;
  public errors: any = {};
  public isAdmin: boolean = false;
  public isEmpleado: boolean = false;
  public editar: boolean = false;
  public tipo_user: string = "";
  public idUser: number = 0;
  public rol: string = "";

  constructor(
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private router: Router,
    private administradoresService: AdministradoresService,
    private empleadosService: EmpleadosService
  ) {}

  ngOnInit() {
    if (this.activatedRoute.snapshot.params['rol'] != undefined) {
      this.rol = this.activatedRoute.snapshot.params['rol'];
      console.log("Rol detectado: ", this.rol);
    }

    if (this.activatedRoute.snapshot.params['id'] != undefined) {
      this.editar = true;
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

  public radioChange(event: MatRadioChange) {
    if (event.value === "administrador") {
      this.isAdmin = true;
      this.isEmpleado = false;
      this.tipo_user = "administrador";
    } else if (event.value === "empleado") {
      this.isAdmin = false;
      this.isEmpleado = true;
      this.tipo_user = "empleado";
    }
  }

  public registrar(): void {
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

  public regresar() {
    this.location.back();
  }
}
