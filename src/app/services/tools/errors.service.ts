import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorsService {

  public generic: string;
  public required: string;
  public numeric: string;
  public betweenDates: string;
  public email: string;

  constructor() {
    this.generic = 'Favor de verificar, el tipo de dato introducido no es válido';
    this.required = 'Campo requerido';
    this.numeric = 'Solo se aceptan valores numéricos';
    this.betweenDates = 'Fecha no válida';
    this.email = 'Favor de introducir un correo electrónico con el formato correcto';
   }

   between(min:any, max:any){
    return 'El valor introducido debe de ser entre ' + min + 'y' + max;
   }

   max(size:any){
    return 'Se excedió la longitud del campo aceptada: ' + size;
   }

   min(size:any){
    return 'El campo no cumple con la longitud aceptada: ' + size;
   }
}
