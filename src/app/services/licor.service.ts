import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ErrorsService } from './tools/errors.service';
import { ValidatorService } from './tools/validator.service';
import { FacadeService } from './facade.service';


@Injectable({
  providedIn: 'root',
})
export class LicorService {
  private baseUrl = environment.url_api; // usar la url definida en environment

  constructor(
    private http: HttpClient,
    private facadeService: FacadeService,
    private validatorService: ValidatorService,
    private errorService: ErrorsService
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
    if (!this.validatorService.required(data['imagen']) && !editar) {
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

  public obtenerLicorPorNombre(nombre: string) {
    const q = encodeURIComponent(nombre ?? '');
    const buscado = (nombre || '').toString().toLowerCase().trim();
    const token = (this as any).facadeService?.getSessionToken?.() ?? '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Token ${token}` : ''
    });

    const urlSingle = `${this.baseUrl}/licor/?nombre=${q}`;
    const urlList = `${this.baseUrl}/lista-licores/`;

    return this.http.get<any>(urlSingle, { headers }).pipe(
      catchError(() => of(null)), // si falla la búsqueda directa, fallback a lista
      switchMap(resp => {
        // si la respuesta directa tiene campo error o es null -> fallback
        if (!resp || (typeof resp === 'object' && 'error' in resp)) {
          return this.http.get<any[]>(urlList, { headers }).pipe(
            catchError(() => of(null)),
            map(list => {
              if (!Array.isArray(list)) return null;
              return list.find(x => ((x?.marca || x?.nombre) || '').toString().toLowerCase().trim() === buscado) ?? null;
            })
          );
        }
        // respuesta directa válida: puede ser array o objeto
        const producto = Array.isArray(resp) ? resp[0] : resp;
        return of(producto ?? null);
      }),
      catchError(err => {
        console.error('[LicorService] obtenerLicorPorNombre final error', err);
        return of(null);
      })
    );
  }

  //Registrar un nuevo licor
  public registrarLicor(licor: any): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.post<any>(`${environment.url_api}/licores/`, licor, { headers });
  }

  // Actualizar licor with FormData
  public actualizarLicor(nombre: string, data: FormData): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.put<any>(`${environment.url_api}/licores-edit/?nombre=${encodeURIComponent(nombre)}`, data, { headers });
  }

  //Eliminar por nombre
  public eliminarLicor(nombre: string): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.delete<any>(`${environment.url_api}/licores-edit/?nombre=${encodeURIComponent(nombre)}`, { headers });
  }

  //Crear con FormData
  public create(data: FormData): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : ''
    });
    return this.http.post<any>(`${environment.url_api}/licores/`, data, { headers });
  }

  public obtenerLicoresPorTipo(tipo: string): Observable<any[]> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });

    const urlPrimary = `${environment.url_api}/licores/?tipo=${encodeURIComponent(tipo)}`;
    const urlFallback = `${environment.url_api}/lista-licores/?tipo=${encodeURIComponent(tipo)}`;

    // Intentar la URL primaria y si devuelve 404 intentar el fallback
    return this.http.get<any[]>(urlPrimary, { headers }).pipe(
      catchError(err => {
        if (err?.status === 404) {
          console.warn(`Endpoint no encontrado: ${urlPrimary} — intentando fallback: ${urlFallback}`);
          return this.http.get<any[]>(urlFallback, { headers }).pipe(
            catchError(err2 => {
              console.error('Fallback también falló:', err2);
              return throwError(() => err2);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtener licores ordenados por fecha_caducidad asc (más próximo primero).
   * Intenta usar endpoint directo en backend si existe; si no, usa obtenerListaLicores y ordena en cliente.
   */
  public obtenerLicoresProximosACaducar(): Observable<any[]> {
    // Si backend tiene endpoint específico, úsalo. Aquí hacemos fallback cliente:
    return this.obtenerListaLicores().pipe(
      map((resp: any) => {
        const items: any[] = Array.isArray(resp) ? resp : (resp?.results ?? resp?.data ?? []);
        // Normalizar campo fecha_caducidad y ordenar asc
        return items
          .map(i => ({ ...i, fecha_caducidad_parsed: i.fecha_caducidad ? new Date(i.fecha_caducidad) : null }))
          .sort((a, b) => {
            const da = a.fecha_caducidad_parsed ? a.fecha_caducidad_parsed.getTime() : Number.MAX_SAFE_INTEGER;
            const db = b.fecha_caducidad_parsed ? b.fecha_caducidad_parsed.getTime() : Number.MAX_SAFE_INTEGER;
            return da - db;
          });
      })
    );
  }

  /**
   * Devuelve un arreglo de { fecha: 'YYYY-MM-DD', count: number }.
   * Usar fallback cliente (calcular desde obtenerListaLicores) para evitar 404 si backend no expone el endpoint.
   */
  public obtenerConteoPorFechaCaducidad(): Observable<{ fecha: string; count: number }[]> {
    return this.obtenerListaLicores().pipe(
      map((resp: any) => {
        const items: any[] = Array.isArray(resp) ? resp : (resp?.results ?? resp?.data ?? []);
        const mapCount: Record<string, number> = {};

        items.forEach(i => {
          // Priorizar el campo 'caducidad' (igual que en proximosAVencer), si no existe probar 'fecha_caducidad'
          const raw = i?.caducidad ?? i?.fecha_caducidad ?? i?.fecha_vencimiento ?? null;
          if (!raw) return;

          // Si viene como string ISO o "YYYY-MM-DD..." tomamos los primeros 10 chars (evita shifts por TZ)
          if (typeof raw === 'string' && raw.length >= 10) {
            const key = raw.slice(0, 10);
            mapCount[key] = (mapCount[key] || 0) + 1;
            return;
          }

          // Si viene como Date/numero, convertir a YYYY-MM-DD en zona local
          const d = new Date(raw);
          if (isNaN(d.getTime())) return;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          mapCount[key] = (mapCount[key] || 0) + 1;
        });

        return Object.keys(mapCount)
          .map(k => ({ fecha: k, count: mapCount[k] }))
          .sort((a, b) => a.fecha.localeCompare(b.fecha));
      })
    );
  }

  public obtenerLicoresPorFecha(fecha: string): Observable<any[]> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    });

    // Intentar backend por si existe, pero el fallback filtra por los mismos campos usados en proximosAVencer
    const urlBackend = `${environment.url_api}/licores/?fecha_caducidad=${encodeURIComponent(fecha)}`;
    return this.http.get<any[]>(urlBackend, { headers }).pipe(
      catchError(() => {
        return this.obtenerListaLicores().pipe(
          map((resp: any) => {
            const items: any[] = Array.isArray(resp) ? resp : (resp?.results ?? resp?.data ?? []);
            return items.filter(i => {
              const raw = i?.caducidad ?? i?.fecha_caducidad ?? i?.fecha_vencimiento ?? null;
              if (!raw) return false;

              if (typeof raw === 'string' && raw.length >= 10) {
                return raw.slice(0, 10) === fecha;
              }
              const d = new Date(raw);
              if (isNaN(d.getTime())) return false;
              const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              return key === fecha;
            });
          })
        );
      })
    );
  }

  /**
   * Buscar licores por texto (intenta backend ?search=, sino filtra en cliente)
   */
  public obtenerLicoresPorQuery(q: string) {
    const qtrim = (q ?? '').toString().trim();
    if (!qtrim) {
      return this.obtenerListaLicores();
    }

    const tryUrl = `${environment.url_api}/licores/?search=${encodeURIComponent(qtrim)}`;
    return this.http.get<any[]>(tryUrl).pipe(
      catchError(() => {
        return this.obtenerListaLicores().pipe(
          map((resp: any) => {
            const items: any[] = Array.isArray(resp) ? resp : (resp?.results ?? resp?.data ?? []);
            const ql = qtrim.toLowerCase();
            return items.filter(i => {
              const fields = [
                i?.nombre,
                i?.marca,
                i?.tipo,
                i?.categoria,
                i?.descripcion
              ].map(x => (x ?? '').toString().toLowerCase());
              return fields.some(f => f.includes(ql));
            });
          })
        );
      })
    );
  }

  /**
   * Intentar actualizar la cantidad/stock de un licor en backend.
   * Prueba PATCH /licores/{id}/, si falla intenta endpoints alternativos.
   */
  public actualizarCantidad(id: any, body: { cantidad?: number; articulos?: number; articulos_por_unidad?: number }): Observable<any> {
    const token = this.facadeService?.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // Django DRF TokenAuthentication espera: "Token <key>"
      'Authorization': token ? `Token ${token}` : ''
    });

    const cantidadNum = Number(body.articulos_por_unidad ?? body.articulos ?? body.cantidad ?? 0);
    const payload = { articulos_por_unidad: cantidadNum };

    const urlUpdate = `${this.baseUrl}/licores/${id}/update/`;      // existe en tu URLconf
    const urlPatch = `${this.baseUrl}/licores/${id}/patch/`;        // existe en tu URLconf
    const urlFallback = `${this.baseUrl}/licores/actualizar/`;     // existe en tu URLconf

    console.log('[LicorService] actualizarCantidad ->', { urlUpdate, urlPatch, urlFallback, payload });

    return this.http.post<any>(urlUpdate, payload, { headers }).pipe(
      tap(resp => console.log('[LicorService] POST update success', resp)),
      catchError((errPost: any) => {
        console.warn('[LicorService] POST update falló', errPost?.status, errPost?.error);
        return this.http.patch<any>(urlPatch, payload, { headers }).pipe(
          tap(resp => console.log('[LicorService] PATCH success', resp)),
          catchError((errPatch: any) => {
            console.warn('[LicorService] PATCH falló', errPatch?.status, errPatch?.error);
            return this.http.post<any>(urlFallback, payload, { headers }).pipe(
              tap(resp => console.log('[LicorService] FALLBACK POST success', resp)),
              catchError((errFallback: any) => {
                console.error('[LicorService] todas las opciones fallaron', errFallback?.status, errFallback?.error);
                return throwError(() => errFallback);
              })
            );
          })
        );
      })
    );
  }

  public obtenerPorNombre(nombre: string) {
    const buscado = (nombre || '').toString().toLowerCase().trim();
    // obtener token desde facadeService si existe
    const token = (this as any).facadeService?.getSessionToken?.() ?? '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Token ${token}` : ''
    });

    return this.http.get<any[]>(`${this.baseUrl}/lista-licores/`, { headers }).pipe(
      map(list => {
        if (!Array.isArray(list)) return null;
        const found = list.find(x => ((x?.marca || x?.nombre) || '').toString().toLowerCase().trim() === buscado);
        return found ?? null;
      }),
      catchError(err => {
        console.error('[LicorService] obtenerPorNombre error', err);
        return of(null);
      })
    );
  }
}

