import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ValidatorService } from './tools/validator.service';
import { ErrorsService } from './tools/errors.service';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AdministradoresService {
  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService
  ) {}

  public validarAdmin(data: any, editar: boolean): any {
    console.log('Validando admin...', data);
    let error: any = [];

    if (!this.validatorService.required(data['nombre'])) {
      error['nombre'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['apellido'])) {
      error['apellido'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['email'])) {
      error['email'] = this.errorService.required;
    } else if (!this.validatorService.email(data['email'])) {
      error['email'] = this.errorService.email;
    }

    if (!editar) {
      if (!this.validatorService.required(data['password'])) {
        error['password'] = this.errorService.required;
      }

      if (!this.validatorService.required(data['confirmPassword'])) {
        error['confirmPassword'] = this.errorService.required;
      } else if (data['password'] !== data['confirmPassword']) {
        error['confirmPassword'] = 'Las contraseñas no coinciden';
      }
    }

    if (!this.validatorService.required(data['clave_admin'])) {
      error['clave_admin'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['telefono'])) {
      error['telefono'] = this.errorService.required;
    }

    return error;
  }

  public registrarAdmin(data: any): Observable<any> {
    // Cambiado a la ruta correcta del backend
    return this.http.post<any>(`${environment.url_api}/admin/`, data, httpOptions);
  }

  public getAdminByID(id: number): Observable<any> {
    return this.http.get<any>(`${environment.url_api}/admin/?id=${id}`, httpOptions);
  }

  public editarAdmin(data: any): Observable<any> {
    return this.http.put<any>(`${environment.url_api}/admins-edit/`, data, httpOptions);
  }
}
