import { Component, Input } from '@angular/core';
import { LicorService } from '../../services/licor.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-eliminar-licor-modal',
  templateUrl: './eliminar-licor-modal.html',
  styleUrls: ['./eliminar-licor-modal.scss']
})
export class EliminarLicorModalComponent {
  @Input() licorNombre!: string;

  constructor(
    private licorService: LicorService,
    private router: Router
  ) {}

  cerrar_modal(): void {
    const modal = document.querySelector('.wrapper') as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  eliminarLicor(): void {
    if (!this.licorNombre) {
      alert('No se especificó un licor');
      return;
    }

    this.licorService.eliminarLicor(this.licorNombre).subscribe({
      next: () => {
        alert(`Licor "${this.licorNombre}" eliminado con éxito`);
        this.cerrar_modal();
        this.router.navigate(['productos']);
      },
      error: (err) => {
        console.error('Error al eliminar el licor:', err);
        alert('No se pudo eliminar el licor');
      }
    });
  }
}
