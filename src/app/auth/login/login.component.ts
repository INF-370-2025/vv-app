import { Component, OnInit, ViewChild } from '@angular/core';
import { AppModule } from '../../app.module';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BreakpointService } from '../../services/breakpoint.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AppModule, NgxMaterialIntlTelInputComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less'
})
export class LoginComponent implements OnInit {

  //Form
  loginFormSms: FormGroup = new FormGroup({
    phoneNumber:  new FormControl(null, [Validators.required]),
  });

  loginFormEmail: FormGroup = new FormGroup({
    emailAddress:  new FormControl(null, [Validators.required,Validators.email]),
  });


  // OTP Area
  showOTPEnter:boolean = false;
  phoneNumber!:string;
  phoneNumberControl = this.loginFormSms.get('phoneNumber') as FormControl;
  emailAddress!:string;


  timerSubscription: Subscription | null = null;
  showTimer:boolean = false;
  timeLeft: number = 90;
  displayTime: string = '';
  otp!:string;



  // General
  isSmsLogin:boolean = true;
  isloadingBtn:boolean = false;


  constructor(public breakpoint:BreakpointService,private supabase:SupabaseService,private notification:NotificationService,private router:Router,private auth:AuthService) {}

  ngOnInit(): void {
    if(this.auth.isLoggedInSubject.value == true) {
      this.router.navigateByUrl('/home')
    }
  }

  goBackToInput(): void {
    this.showOTPEnter = false;
    this.otp = ''; // Clear the OTP input
    this.showTimer = false; // Reset timer if needed
    this.timeLeft = 90; // Reset timer countdown
    this.displayTime = ''; // Clear display time
  }

  onOtpInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Allow only numeric input and restrict length
    this.otp = input.value.replace(/[^0-9]/g, '').slice(0, 6);
    input.value = this.otp; // Update the input value after filtering

    // Auto-submit when OTP length reaches 6
    if (this.otp.length === 6) {
       this.verifyOTP();
    }
  }

  async sendOTP() {
    try{
      this.isloadingBtn = true;
      if(this.isSmsLogin) {
        this.phoneNumber = this.formatPhoneNumber(this.loginFormSms.value.phoneNumber);

        // Check if form is valid
        if (!this.loginFormSms.valid) {
          Object.values(this.loginFormSms.controls).forEach(control => {
            if (control.invalid) {
              control.markAsDirty();
              control.updateValueAndValidity({ onlySelf: true });
            }
          });
        } else {

          const response = await this.supabase.sign_in(true,this.phoneNumber,"");
          if(!response) {
            this.notification.showError("Unauthorised Login Attempted, Please contact Admin");
          } else {
            let message = "Please check your sms for the access code";
            this.notification.showSuccess(message,"Access Code Sent");
            this.showOTPEnter = true;
          }

        }
      }
      else {
        this.emailAddress =  this.loginFormSms.value.emailAddress;
        // Check if form is valid
        if (!this.loginFormEmail.valid) {
          Object.values(this.loginFormEmail.controls).forEach(control => {
            if (control.invalid) {
              control.markAsDirty();
              control.updateValueAndValidity({ onlySelf: true });
            }
          });
        } else {

         const response = await this.supabase.sign_in(true,"",this.emailAddress);
          if(!response) {
            this.notification.showError("Unauthorised Login Attempted, Please contact Admin");
          } else {
            let message = "Please check your email for the access code";
            this.notification.showSuccess(message,"Access Code Sent");
            this.showOTPEnter = true;
          }

        }
      }
      this.isloadingBtn = false;
    } catch(error) {
      console.log(error);
      this.notification.showError("Something went wrong , Please try again later","Login Error");
      this.isloadingBtn = false;
    }
  }

  async resendOtp() {
     try{
      if(this.isSmsLogin) {
          const response = await this.supabase.sign_in(true,this.phoneNumber,"");
          if(!response) {
            this.notification.showError("Unauthorised Login Attempted, Please contact Admin");
          } else {
            let message = "Please check your sms for the access code";
            this.notification.showSuccess(message,"Access Code Sent");
            this.showOTPEnter = true;
          }
      }
      else {

         const response = await this.supabase.sign_in(false,"",this.emailAddress);
          if(!response) {
            this.notification.showError("Unauthorised Login Attempted, Please contact Admin");
          } else {
            let message = "Please check your email for the access code";
            this.notification.showSuccess(message,"Access Code Sent");
            this.showOTPEnter = true;
          }
      }
    } catch(error) {
      console.log(error);
      this.notification.showError("Something went wrong , Please try again later","Login Error");
    }
  }

  async verifyOTP() {
    if (this.otp.length < 6) {
      this.notification.showWarning("Invalid OTP Entered, Please try again");
    }
    else {
      this.isloadingBtn = true;
      let isSms = true;
      let value = this.phoneNumber;

      if(!this.isSmsLogin) {
        isSms = false;
        value = this.emailAddress;
      }

      const response = await this.supabase.verify_user(isSms,this.otp,value);
      if(!response) {
        this.notification.showError("Unauthorised Login Attempted, Please contact Admin");
      } else {
        this.isloadingBtn = false;
        this.otp = '';
        this.phoneNumber = '';
        this.router.navigateByUrl('/home');
        this.notification.showSuccess("Welcome Back !!");
        this.showOTPEnter = true;
      }
    }
  }

  formatPhoneNumber = (phoneNumber: string): string => {
    // Trim whitespace and remove spaces
    return phoneNumber.replace(/[^+\d]/g, '');
  };


}
