import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FacadeService } from '../../services/facade.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() tipo: string = "";
  @Input() rol: string = "";

  public token: string = "";
  public editar: boolean = false;
  public usuario: { nombre: string } = { nombre: '' };

  constructor(
    private router: Router,
    public activatedRoute: ActivatedRoute,
    private facadeService: FacadeService
  ) {}

  ngOnInit(): void {


    if (this.activatedRoute.snapshot.params['id'] !== undefined) {
      this.editar = true;
    }
  }

  public navigate(ruta: string): void {
    this.router.navigate([ruta]);
  }

  public filtrarTipo(tipo: string): void {
    this.router.navigate(['/agregar'], { queryParams: { tipo } });
  }
}
