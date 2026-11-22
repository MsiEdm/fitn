import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface AuthForm {
  username: string;
  email: string;
  password: string;
}

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-auth-page',
  templateUrl: './auth-page.html',
})
export class AuthPage {
  @Input({ required: true }) registerMode = false;
  @Input({ required: true }) requestBusy = false;
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) authForm!: AuthForm;
  @Input({ required: true }) verificationPending = false;
  @Input({ required: true }) verificationCode = '';
  @Output() readonly submitAuth = new EventEmitter<void>();
  @Output() readonly toggleAuthMode = new EventEmitter<void>();
  @Output() readonly verificationCodeChange = new EventEmitter<string>();
  @Output() readonly resendCode = new EventEmitter<void>();
  @Output() readonly cancelVerification = new EventEmitter<void>();
}
