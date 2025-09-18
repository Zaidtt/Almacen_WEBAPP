import { Component, OnInit} from '@angular/core';
import { NavbarComponent } from '../../partials/navbar/navbar.component';

@Component({
  selector: 'licor-licores-screen',
  imports: [
    NavbarComponent,

  ],
  templateUrl: './licores-screen.html',
  styleUrl: './licores-screen.scss'
})
export class LicoresScreen implements OnInit {

  constructor() {

  }

 ngOnInit(): void{

  }
}
