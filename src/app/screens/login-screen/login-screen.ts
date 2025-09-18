import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FacadeService } from '../../services/facade.service';

@Component({
  selector: 'licor-login-screen',
  templateUrl: './login-screen.html',
  styleUrls: ['./login-screen.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule
  ]
})
export class LoginScreen implements OnInit {
  public email: string = '';
  public password: string = '';
  public type: string = 'password';
  public errors: any = {};
  public load: boolean = false;

  private router = inject(Router);

  constructor(private facadeService: FacadeService) {}

  ngOnInit(): void {}

  public login(): void {
    this.errors = {};

    // Validación usando FacadeService
    this.errors = this.facadeService.validarLogin(this.email, this.password);

    // Reemplazo de $.isEmptyObject
    if (Object.keys(this.errors).length > 0) {
      return;
    }

    // Login usando FacadeService
    this.facadeService.login(this.email, this.password).subscribe({
  next: (response) => {
    console.log('Login exitoso:', response);

    // Guardar token en localStorage
    localStorage.setItem('token', response.token);

    // Guardar otros datos del usuario si lo deseas
    this.facadeService.saveUserData(response);

    // Navegar a la página principal
    this.router.navigate(['/productos']);
  },
  error: (err) => {
    console.error('Error de login:', err);
    alert('Credenciales inválidas o el servicio no respondió');
  }
});
  }

  public showPassword(): void {
    this.type = this.type === 'password' ? 'text' : 'password';
  }

  public registrar(): void {
    this.router.navigate(['registro']);
  }
}
