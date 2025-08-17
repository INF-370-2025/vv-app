import { Component } from '@angular/core';
import { AppModule } from '../../app.module';
import { ApiService } from './../../services/api.service';
import { AuthService } from './../../services/auth.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { customer, employee, insertCustomer, insertUser, user } from '../../models/user';
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

  // async uploadImage() {
  //   this.isuploading = true;
  //   const file_url = await this.supabase.uploadFileToStorage(this.file!,"images");
  //   this.image_url = file_url;
  //   await this.supabase.update_profile_pic(this.auth.user?.user_id!,this.image_url);
  //   this.file = undefined;
  //   this.fileList = [];
  //    this.isuploading = false;
  // }

    async uploadImage() {
    this.isuploading = true;
    const file_url = await this.supabase.uploadFileToStorage(this.file!, "images");

    // Update the database
    await this.supabase.update_profile_pic(this.auth.user?.user_id!, file_url);

    // Update local user objects
    if (this.auth.user) {
      this.auth.user.image = file_url;
    }
    if (this.user?.user) {
      this.user.user.image = file_url;
    }

    this.file = undefined;
    this.fileList = [];
    this.isuploading = false;
  }

  submitForm()
  {
     let update_user = new insertUser();
     let update_customer = new insertCustomer();
     let update_user_id = this.auth.user?.user_id!;
     let update_customer_id = this.auth.user?.customer?.customer_id!;


       update_user.name = this.customerForm.value.name;
       update_user.surname = this.customerForm.value.surname;
       update_user.email_address = this.customerForm.value.email;
       update_user.phone_number = this.customerForm.value.phone;
       update_user.image = this.auth.user!.image;
       update_user.is_employee = this.auth.user!.is_employee;
       update_user.role_id = this.auth.user!.role_id;
       update_user.title_id = this.auth.user!.title_id;
       update_user.uuid = this.auth.user!.uuid;

      //  update_customer.company_name = this.customerForm.value.companyName;
      //  update_customer.telephone = this.customerForm.value.telephone;
      //  update_customer.address = this.customerForm.value.address;
      //  update_customer.registration_number = this.customerForm.value.registrationNumber;
      //  update_customer.vat_number = this.customerForm.value.vatNumber;
      //  //update_customer.customer_type_id = 1; //this.auth.user?.customer?.customer_type_id!;
      //  update_customer.user_id = update_user_id;

      this.btnLoading = true;


       this.apiService.update_user(update_user_id,update_user).subscribe({
         next: res => {
           if(!res.error) {
             this.notificationService.showSuccess(res.message);
           } else {
             this.notificationService.showError(res.error);
           }
         },
         error: (error) => {
           this.notificationService.showError(error);
         }
       });

      //  this.apiService.update_customer(update_customer_id,update_customer).subscribe({
      //    next: res => {
      //      if(!res.error) {
      //        this.notificationService.showSuccess(res.message);
      //        this.loadDetails();
      //      } else {
      //        this.notificationService.showError(res.error);
      //      }
      //        this.btnLoading = false;
      //    },
      //    error: (error) => {
      //      this.notificationService.showError(error);
      //      this.btnLoading = false;
      //      console.log(update_customer);
      //    }
      //  });

  }
}
