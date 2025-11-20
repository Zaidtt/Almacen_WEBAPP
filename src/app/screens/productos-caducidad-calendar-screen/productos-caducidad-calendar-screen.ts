import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../partials/navbar/navbar.component';
import { LicorService } from '../../services/licor.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-productos-caducidad-calendar-screen',
  templateUrl: './productos-caducidad-calendar-screen.html',
  styleUrls: ['./productos-caducidad-calendar-screen.scss'],
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ProductosCaducidadCalendarScreen implements OnInit {
  public year = new Date().getFullYear();
  public month = new Date().getMonth(); // 0-indexed
  public days: { date: Date; iso: string; count?: number }[] = [];
  public countsMap: Record<string, number> = {};
  public loading = false;
  public error: string | null = null;
  private backendUrl = environment.url_api ?? 'http://127.0.0.1:8000';

  constructor(private licorService: LicorService, private router: Router) {}

  ngOnInit(): void {
    this.buildMonth();
    this.loadCounts();
  }

  private buildMonth(): void {
    this.days = [];
    const first = new Date(this.year, this.month, 1);
    const last = new Date(this.year, this.month + 1, 0);
    for (let d = first.getDate(); d <= last.getDate(); d++) {
      const dt = new Date(this.year, this.month, d);
      this.days.push({ date: dt, iso: dt.toISOString().slice(0, 10), count: 0 });
    }
  }

  private loadCounts(): void {
    this.loading = true;
    this.licorService.obtenerConteoPorFechaCaducidad().subscribe({
      next: (data: any[]) => {
        this.countsMap = {};
        (data || []).forEach((c: any) => {
          this.countsMap[c.fecha] = c.count;
        });
        this.days.forEach(day => {
          day.count = this.countsMap[day.iso] || 0;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error conteo por fecha:', err);
        this.error = 'No se pudo cargar el calendario.';
        this.loading = false;
      }
    });
  }

  public prevMonth(): void {
    if (this.month === 0) { this.month = 11; this.year--; } else this.month--;
    this.buildMonth();
    this.loadCounts();
  }

  public nextMonth(): void {
    if (this.month === 11) { this.month = 0; this.year++; } else this.month++;
    this.buildMonth();
    this.loadCounts();
  }

  public abrirFecha(iso: string): void {
    // Forzar navegación a otra página (no scroll en la misma página)
    const url = `/productos/caducidad?fecha=${encodeURIComponent(iso)}`;
    // use navigateByUrl para evitar que alguna lógica local haga scroll en la misma vista
    this.router.navigateByUrl(url).catch(err => {
      // fallback: recarga la página si la navegación angular falla
      window.location.href = url;
    });
  }

  public nombreMes(): string {
    return new Date(this.year, this.month).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }
}
