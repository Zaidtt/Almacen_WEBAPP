import { Routes } from '@angular/router';
import { LoginScreen } from './screens/login-screen/login-screen';
import { ProductosScreen } from './screens/productos-screen/productos-screen';
import { ProductoScreen } from './screens/producto-screen/producto-screen';
import { AgregarScreen } from './screens/agregar-screen/agregar-screen';
import { RegistroUsuariosScreenComponent } from './screens/registro-usuarios-screen/registro-usuarios-screen';
import { ProductosTipoScreen } from './screens/productos-tipo-screen/productos-tipo-screen';
import { ProductosCaducidadScreen } from './screens/productos-caducidad-screen/productos-caducidad-screen';
import { ProductosCaducidadCalendarScreen } from './screens/productos-caducidad-calendar-screen/productos-caducidad-calendar-screen';
import { ProductosBuscarScreen } from './screens/productos-buscar-screen/productos-buscar-screen';

export const routes: Routes = [
  { path: '', component: LoginScreen },
  { path: 'productos', component: ProductosScreen },

  {
    path: 'productos/tipo',
    loadComponent: () => import('./screens/productos-tipo-screen/productos-tipo-screen').then(m => m.ProductosTipoScreen)
  },

  {
    path: 'productos/caducidad-calendar',
    loadComponent: () => import('./screens/productos-caducidad-calendar-screen/productos-caducidad-calendar-screen').then(m => m.ProductosCaducidadCalendarScreen)
  },

  {
    path: 'productos/caducidad',
    loadComponent: () =>
      import('./screens/productos-caducidad-screen/productos-caducidad-screen').then(m => m.ProductosCaducidadScreen)
  },

  {
    path: 'productos/buscar',
    loadComponent: () =>
      import('./screens/productos-buscar-screen/productos-buscar-screen').then(m => m.ProductosBuscarScreen)
  },

  { path: 'productos/:categoria/:nombre', component: ProductoScreen },
  { path: 'registro', component: RegistroUsuariosScreenComponent },
  { path: 'agregar', component: AgregarScreen },
  { path: 'editar/:nombre', component: AgregarScreen },
];
