import { Component } from '@angular/core';
import { AppModule } from '../../app.module';
import { ApiService } from './../../services/api.service';
import { AuthService } from './../../services/auth.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { customer, employee, user } from '../../models/user';
import { SupabaseService } from '../../services/supabase.service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AppModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.less'
})
export class ProfileComponent {

  isLoading:boolean = true;
  isuploading:boolean = false;
  user?:employee | customer;
  btnLoading:boolean = false;
  file!: NzUploadFile | undefined;
  fileList :any[] = [];
  image_url:string = this.user?.user?.image!;

  customerForm: FormGroup = new FormGroup({
    name:  new FormControl(null, [Validators.required]),
    surname:  new FormControl(null, [Validators.required]),
    email:  new FormControl(null, [Validators.required,Validators.email]),
    phone:  new FormControl(null, [Validators.required,Validators.maxLength(12)]),
    companyName: new FormControl(null, [Validators.required]),
    telephone:  new FormControl(null, [Validators.required]),
    registrationNumber :new FormControl(null, [Validators.required]),
    vatNumber: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [Validators.required]),
  });


  employeeForm: FormGroup = new FormGroup({
    name:  new FormControl(null, [Validators.required]),
    surname:  new FormControl(null, [Validators.required]),
    email:  new FormControl(null, [Validators.required,Validators.email]),
    phone:  new FormControl(null, [Validators.required,Validators.maxLength(12)]),
    address: new FormControl(null, [Validators.required]),
    emergencyContact: new FormControl(null, [Validators.required]),
    jobScope:  new FormControl(null, [Validators.required]),
  });


  constructor(private notificationService:NotificationService,private route: ActivatedRoute,
    public auth:AuthService,private router:Router,private apiService:ApiService,private supabase: SupabaseService) { }

  ngOnInit()
  {
    this.isLoading = true;
    setTimeout(() => {
      this.loadDetails();
    }, 300);
  }

  loadDetails()
  {
    let user = this.auth.user!;
    this.image_url = this.user?.user?.image!;

    if(user.role_id ==6) {
       this.apiService.get_profile_customer(this.auth.user?.user_id!).subscribe({
            next: res => {
             this.user = res[0] as customer;
             this.setDetails();
            },
            error: (error) => {
              this.notificationService.showError("An Error Occoured while processing your request");
              this.isLoading = false;
            }
          });
    } 

    if(user.role_id !=6){
       this.apiService.get_profile_employee(this.auth.user?.user_id!).subscribe({
            next: res => {
             this.user = res[0] as employee;
             this.setDetails();
            },
            error: (error) => {
              this.notificationService.showError("An Error Occoured while processing your request");
              this.isLoading = false;
            }
          });
    }
  }

  setDetails()
  {
    if(this.auth.user?.role_id ==6) {
      this.customerForm.controls['name'].setValue(this.user?.user?.name);
      this.customerForm.controls['surname'].setValue(this.user?.user?.surname);
      this.customerForm.controls['email'].setValue(this.user?.user?.email_address);
      this.customerForm.controls['phone'].setValue(this.user?.user?.phone_number);
      this.customerForm.controls['companyName'].setValue((this.user as customer).company_name);
      this.customerForm.controls['telephone'].setValue((this.user as customer).telephone);
      this.customerForm.controls['registrationNumber'].setValue((this.user as customer).registration_number);
      this.customerForm.controls['vatNumber'].setValue((this.user as customer).vat_number);
      this.customerForm.controls['address'].setValue((this.user as customer).address);
    } else {
      this.customerForm.controls['name'].setValue(this.user?.user?.name);
      this.customerForm.controls['surname'].setValue(this.user?.user?.surname);
      this.customerForm.controls['email'].setValue(this.user?.user?.email_address);
      this.customerForm.controls['phone'].setValue(this.user?.user?.phone_number);
      this.customerForm.controls['emergencyContact'].setValue((this.user as employee).emergency_contact);
      this.customerForm.controls['telephone'].setValue((this.user as employee).job_scope);
       this.customerForm.controls['address'].setValue((this.user as employee).address);
    }
  }

  beforeUpload = (file: NzUploadFile,$event:any): boolean => {
    this.fileList = this.fileList.concat(file);
    this.file = this.fileList[0];
    this.uploadImage();
    return false;
  };

  async uploadImage() {
    this.isuploading = true;
    const file_url = await this.supabase.uploadFileToStorage(this.file!,"images");
    this.image_url = file_url;
    await this.supabase.update_profile_pic(this.auth.user?.user_id!,this.image_url);
    this.file = undefined;
    this.fileList = [];
     this.isuploading = false;
  }

  submitForm()
  {
   //   let update_user = new user();
    //   //update_user.user_id = this.auth.currentUser?.user_id!;
    //   // update_user.name = this.detailsForm.value.name;
    //   // update_user.surname = this.detailsForm.value.surname;
    //   // update_user.email_address = this.detailsForm.value.email;
    //   // update_user.phone_number = this.detailsForm.value.phone;
    //   // update_user.company_name = this.detailsForm.value.companyName;
    //   // update_user.telephone = this.detailsForm.value.telephone;
    //   this.btnLoading = true;
    //   // this.apiService.updateUserDetails(update_user).subscribe({
    //   //   next: res => {
    //   //     if(!res.error) {
    //   //       this.notificationService.showSuccess(res.message);
    //   //       this.loadDetails();
    //   //       this.auth.check_session().subscribe();
    //   //     } else {
    //   //       this.notificationService.showError(res.error);
    //   //     }
    //   //       this.btnLoading = false;
    //   //   },
    //   //   error: (error) => {
    //   //     this.notificationService.showError(error);
    //   //     this.btnLoading = false;
    //   //   }
    //   // });

  }
}
