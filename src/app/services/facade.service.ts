import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ValidatorService } from './tools/validator.service';
import { Router } from '@angular/router';
import { ErrorsService } from './tools/errors.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

//Estas son variables para las cookies
const session_cookie_name = 'crud-escolar-token';
const user_email_cookie_name = 'crud-escolar-email';
const user_id_cookie_name = 'crud-escolar-user_id';
const user_complete_name_cookie_name = 'crud-escolar-user_complete_name';
const group_name_cookie_name = 'crud-escolar-group_name';
const codigo_cookie_name = 'crud-escolar-codigo';

@Injectable({
  providedIn: 'root'
})
export class FacadeService {

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService,
    private validatorService: ValidatorService,
    private errorService: ErrorsService
  ) { }

  //Funcion para validar login
  public validarLogin(username: String, password: String) {
    var data = {
      "username": username,
      "password": password
    }
    console.log("Validando login... ", data);
    let error: any = [];

    if(!this.validatorService.required(data["username"])){
      error["username"] = this.errorService.required;
    }else if (!this.validatorService.max(data["username"], 40)){
      error["username"] = this.errorService.max(40);
    }
    else if (!this.validatorService.email(data['username'])){
      error['username'] = this.errorService.email;
    }
    if(!this.validatorService.required(data["password"])){
      error["password"] = this.errorService.required;
    }
    return error;
  }

  //Funciones Basicas
  //Inicio de sesion
  login(username: string, password: string): Observable<any> {
    var data={
      "username": username,
      "password": password
    }
    return this.http.post<any>(`${environment.url_api}/token/`, data);
  }

  //Cerrar Sesión
  logout():Observable<any>{
    var headers: any;
    var token = this.getSessionToken();
    headers = new HttpHeaders({'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token});
    return this.http.get<any>(`${environment.url_api}/logout/`, {headers: headers});
  }

  // Funciones para utilizar las cookies en la web
  retriveSignedUser(){
    var headers: any;
    var token = this.getSessionToken();
    headers = new HttpHeaders({'Authorization': 'Bearer ' + token});
    return this.http.get<any>(`${environment.url_api}/me/`, {headers: headers});
  }
  getCookieValue(key:string){
    return this.cookieService.get(key);
  }
  saveCookieValue(key:string, value:string){
    var secure = environment.url_api.indexOf("https")!=-1;
    this.cookieService.set(key, value, undefined, undefined, undefined, secure, secure?"None":"Lax");
  }
  getSessionToken(){
    return this.cookieService.get(session_cookie_name);
  }

saveUserData(user_data: any) {
  const secure = environment.url_api.indexOf("https") != -1;

  // Determinar si es administrador
  const isAdmin = user_data.rol === "administrador";

  // Para empleados usamos los campos directamente
  const userInfo = isAdmin ? user_data : user_data;

  if (!userInfo) {
    console.warn("saveUserData: user_info es undefined", user_data);
    return;
  }

  // ID y correo
  this.cookieService.set(user_id_cookie_name, userInfo.id?.toString() ?? "", undefined, undefined, undefined, secure, secure ? "None" : "Lax");
  this.cookieService.set(user_email_cookie_name, userInfo.email ?? "", undefined, undefined, undefined, secure, secure ? "None" : "Lax");

  // Nombre completo: si no existe first_name/last_name usamos otros campos disponibles
  const fullName = isAdmin
    ? `${userInfo.first_name ?? ""} ${userInfo.last_name ?? ""}`.trim()
    : `${userInfo.nombre ?? ""} ${userInfo.apellido ?? ""}`.trim() || "Empleado";

  this.cookieService.set(user_complete_name_cookie_name, fullName, undefined, undefined, undefined, secure, secure ? "None" : "Lax");

  // Token
  this.cookieService.set(session_cookie_name, user_data.token ?? "", undefined, undefined, undefined, secure, secure ? "None" : "Lax");

  // Rol correcto
  this.cookieService.set(group_name_cookie_name, userInfo.rol ?? "empleado", undefined, undefined, undefined, secure, secure ? "None" : "Lax");
}
  destroyUser(){
    this.cookieService.deleteAll();
  }
  getUserEmail(){
    return this.cookieService.get(user_email_cookie_name);
  }
  getUserCompleteName(){
    return this.cookieService.get(user_complete_name_cookie_name);
  }
  getUserId(){
    return this.cookieService.get(user_id_cookie_name);
  }
  getUserGroup(){
    return this.cookieService.get(group_name_cookie_name);
  }
}
