import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-check-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule],
  templateUrl: './admin-check-modal.html',
  styleUrls: ['./admin-check-modal.scss']
})
export class AdminCheckModal {
  public adminPassword: string = '';
  public error: boolean = false;

  constructor(private dialogRef: MatDialogRef<AdminCheckModal>) {}

  confirmar() {
    if (this.adminPassword === '1234') {
      this.error = false;
      this.dialogRef.close(true);
    } else {
      this.error = true;
    }
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
