import { Routes } from '@angular/router';
import { LoginScreen } from './screens/login-screen/login-screen';
import { ProductosScreen } from './screens/productos-screen/productos-screen';
import { ProductoScreen } from './screens/producto-screen/producto-screen';
import { AgregarScreen } from './screens/agregar-screen/agregar-screen';
// Update the import to match the actual export from 'registro-screen'
import { RegistroUsuariosScreenComponent } from './screens/registro-usuarios-screen/registro-usuarios-screen';

export const routes: Routes = [
   { path: '', component: LoginScreen },
   { path: 'productos', component: ProductosScreen },
   { path: 'productos/:categoria/:nombre', component: ProductoScreen },
   { path: 'registro', component: RegistroUsuariosScreenComponent },
   {path: 'agregar', component: AgregarScreen}
];
