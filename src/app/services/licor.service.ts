import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorsService } from './tools/errors.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ValidatorService } from './tools/validator.service';
import { FacadeService } from './facade.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class LicorService {
  constructor(
    private http: HttpClient,
    private errorService: ErrorsService,
    private validatorService: ValidatorService,
    private facadeService: FacadeService
  ) {}

  public esquemaLicor() {
    return {
      nombre: '',
      categoria: '',
      fecha_caducidad: '',
      imagen: ''
    };
  }

  public validarLicor(data: any, editar: boolean = false) {
    console.log('Validando licor... ', data);

    let error: any = {};

    if (!this.validatorService.required(data['nombre'])) {
      error['nombre'] = this.errorService.required;
    }
    if (!this.validatorService.required(data['categoria'])) {
      error['categoria'] = 'Debes seleccionar la categoría';
    }
    if (!this.validatorService.required(data['fecha_caducidad'])) {
      error['fecha_caducidad'] = 'Debes colocar la fecha de caducidad';
    }
    if (!this.validatorService.required(data['imagen'])) {
      error['imagen'] = 'Debes colocar la imagen del licor';
    }

    return error;
  }

  public obtenerListaLicores(): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.get<any>(`${environment.url_api}/lista-licores/`, { headers });
  }

  public obtenerLicorPorNombre(nombre: string): Observable<any> {
  const token = this.facadeService.getSessionToken();
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': token ? 'Bearer ' + token : ''
  });
  // Cambiamos la query de id a nombre
  return this.http.get<any>(`${environment.url_api}/licor/?nombre=${encodeURIComponent(nombre)}`, { headers });
}


  public registrarLicor(licor: any): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.post<any>(`${environment.url_api}/licores/`, licor, { headers });
  }

  public actualizarLicor(licor: any): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.put<any>(`${environment.url_api}/licores-edit/`, licor, { headers });
  }

  public eliminarLicor(nombre: string): Observable<any> {

    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.delete<any>(`${environment.url_api}/licores-edit/?nombre=${encodeURIComponent(nombre)}`, { headers });

  }


  // -----------------------------
  // Método agregado para AgregarScreen
  // -----------------------------
  public create(data: FormData): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.post<any>(`${environment.url_api}/licores/`, data, { headers });
  }
}
