import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../app.module';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { BreakpointService } from '../../services/breakpoint.service';
import { NotificationService } from '../../services/notification.service';
import { SupabaseService } from '../../services/supabase.service';
import { title } from '../../models/title';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { addCustomer } from '../../models/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [AppModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.less'
})
export class RegisterComponent implements OnInit {

  isloadingBtn:boolean = false;
  nzStep:number = 0;
  titles: title[] = [];
  termsModal:boolean = false;
  consent:boolean = false;
  showCompleteError:boolean = false;

  //Form
  registerForm: FormGroup = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    name:  new FormControl(null, [Validators.required]),
    surname:  new FormControl(null, [Validators.required]),
    phoneNumber:  new FormControl(null, [Validators.required,this.phoneNumberValidator]),
    email: new FormControl(null, [Validators.required,Validators.email]),
    companyName: new FormControl(null, [Validators.required]),
    telephone:  new FormControl(null, [Validators.required]),
    registrationNumber :new FormControl(null, [Validators.required]),
    vatNumber: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [Validators.required]),
  });

  constructor(public breakpoint:BreakpointService,private supabase:SupabaseService,private authService:AuthService, private notification:NotificationService,private apiService:ApiService) {

  }

  ngOnInit(): void {
   this.authService.isLoggedInSubject.next(false);
   this.loadTitles();
  }

  loadTitles() {
    try {
        this.apiService.getTitles().subscribe(data => {
        this.titles = data as title[];
      });
    } catch(error) {
      console.log(error);
      this.notification.showError("Something went wrong , Please try again later")
    }
  }

  phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const regex = /^\+\d{8,15}$/; // Starts with +, followed by 8–15 digits

    if (!value || regex.test(value)) {
      return null; // Valid
    }
    return { invalidPhone: true };
  }

  cleanPhoneNumber() {
    const control = this.registerForm.get('phoneNumber');
    const cleaned = control?.value?.replace(/[^\d+]/g, '') || '';
    control?.setValue(cleaned, { emitEvent: false });
  }

  setConsent(state:boolean) {
    this.consent = state;
  }

  submitRegister() {
    if(!this.registerForm.valid) {
        Object.values(this.registerForm.controls).forEach(control => {
            if (control.invalid) {
              control.markAsDirty();
              control.updateValueAndValidity({ onlySelf: true });
            }
        });
    } else {

      this.isloadingBtn = true;
      let customer = new addCustomer();
      customer.title_id= this.registerForm.value.title;
      customer.name= this.registerForm.value.name;
      customer.surname= this.registerForm.value.surname;
      customer.email_address= this.registerForm.value.email;
      customer.phone_number= this.registerForm.value.phoneNumber;
      customer.company_name= this.registerForm.value.companyName;
      customer.telephone= this.registerForm.value.telephone;
      customer.registration_number= this.registerForm.value.registrationNumber;
      customer.vat_number= this.registerForm.value.vatNumber;
      customer.address= this.registerForm.value.address;
      this.apiService.create_customer(customer).subscribe({
        next: res => {
          if(!res.error) {
            this.notification.showSuccess("Success");
            this.registerForm.reset();
            this.nzStep = 2;
            this.showCompleteError = false;
            this.isloadingBtn = false;
          } else {
            this.notification.showError(res.error);
            this.nzStep = 2;
            this.showCompleteError = true;
            this.isloadingBtn = false;
          }
        },
        error: (error) => {
          console.log(error)
          this.notification.showError("An Error Occoured while processing your request");
          this.nzStep = 2;
          this.showCompleteError = true;
          this.isloadingBtn = false;
        }
      });

    }
  }



}
