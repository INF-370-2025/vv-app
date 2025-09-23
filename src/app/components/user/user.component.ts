import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { customer, employee, employeeWarning, user, insertEmployeePaySlip, employeePayslip, insertUser, insertEmployee } from '../../models/user';
import { role } from '../../models/role';
import { title } from '../../models/title';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { FormControl, FormControlName, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-user',
  standalone: true,
  imports: [AppModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.less'
})
export class UserComponent implements OnInit{

  isloading:boolean = false;
  users: user[] = [];
  customers:user[] = [];
  employees:user[] = [];
  staticUsers: user[] = [];
  staticCustomers: user[] = [];
  staticEmployees: user[] = [];
  employeeWarnings:employeeWarning[] = [];
  warningCount: number = 0;
  viewingEmployee:user = new user();

  viewingEmployeeEmployee:employee = new employee();

  viewingEmployeeDetails:employee = new employee();
  viewingCustomer:user = new user();
  showEmployeeModal:boolean = false;
  showCustomerModal:boolean = false;
  selectedTabIndex: number = 0;
  showCreateCustomerModal:boolean = false;
  showCreateEmployeeModal:boolean = false;
  roles:role[] = [];
  titles:title[] = [];
  selectedTitle: number = 0;
  selectedRole: number = 0;
  selectedEmployeeType: number = 0;
  showUploadPayslipModal:boolean = false;
  showWarnEmployeeModal:boolean = false;
  showDisableEmployeeModal:boolean = false;
  showUpdateEmployeeModal:boolean = false;
  employeePayslipId?: number = 0;
  file!: NzUploadFile | undefined;
  fileList :any[] = [];
  employeeIdToUpdate:number = 0;
  showHelp: boolean = false;
  showUpdateCustomerModal: boolean = false;
  customerIdToUpdate: number = 0;


  i: number = 1;
  j: number = 1;

  @Input() employee : user = new user();
  @Output() createdPayslip = new EventEmitter<number>();
  @Output() createdUser = new EventEmitter<number>();

  employeeForm: FormGroup = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    name: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z\s]*$/)
    ]),
    surname: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z\s]*$/)
    ]),
    email_address: new FormControl(null, [
      Validators.required,
      Validators.email,
      Validators.maxLength(100)
    ]),
    phone_number: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[0-9+]{10,15}$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]),
    role: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(200)
    ]),
    emergency_contact: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[0-9+]{10,15}$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]),
    hourly_rate: new FormControl(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(1000),
      Validators.pattern(/^\d+(\.\d{1,2})?$/)
    ]),
    job_scope: new FormControl(null, [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100)
    ]),
  });

  // Replace your updateEmployeeForm with this enhanced version:
  updateEmployeeForm: FormGroup = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    name: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z\s]*$/)
    ]),
    surname: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z\s]*$/)
    ]),
    email_address: new FormControl(null, [
      Validators.required,
      Validators.email,
      Validators.maxLength(100)
    ]),
    phone_number: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[0-9+]{10,15}$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]),
    role: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(200)
    ]),
    emergency_contact: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[0-9+]{10,15}$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]),
    hourly_rate: new FormControl(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(1000),
      Validators.pattern(/^\d+(\.\d{1,2})?$/)
    ]),
    job_scope: new FormControl(null, [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100)
    ]),
  });

  updateCustomerForm: FormGroup = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    name: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z\s]*$/)
    ]),
    surname: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z\s]*$/)
    ]),
    email_address: new FormControl(null, [
      Validators.required,
      Validators.email,
      Validators.maxLength(100)
    ]),
    phone_number: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[0-9+]{10,15}$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]),
    company_name: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ]),
    telephone: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^[0-9+]{10,15}$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]),
    registration_number: new FormControl(null, [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(30),
      Validators.pattern(/^[a-zA-Z0-9\s\-]*$/)
    ]),
    vat_number: new FormControl(null, [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(30),
      Validators.pattern(/^[a-zA-Z0-9\s\-]*$/)
    ]),
    address: new FormControl(null, [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(200)
    ]),
  });

    warningForm:FormGroup = new FormGroup({
      reason: new FormControl(null, [Validators.required]),
      warning_type: new FormControl(null, [Validators.required]),
    });


  constructor(private apiService: ApiService, private supabase:SupabaseService, private notification:NotificationService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadWarnings();
  }

  openHelpModal(): void {
    this.showHelp = true;
  }

  // Function to close the help modal
  closeHelpModal(): void {
    this.showHelp = false;
  }

  loadUsers(): void {
    this.isloading = true;
    this.apiService.get_users().subscribe({
      next: (response) => {
        console.log(response);



        this.users = [...response] as user[];
        this.staticUsers = this.users;
        this.employees = this.users.filter(x => x.is_employee == true);
        this.customers = this.users.filter(x => x.is_employee == false);
        this.staticCustomers = this.customers;
        this.staticEmployees = this.employees;
        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isloading = false;
      }
    });
  }

  //Need to fix
  loadWarnings(): void {

    this.apiService.get_employee_warnings().subscribe({

      next: (response) => {
        this.employeeWarnings = [...response] as employeeWarning[];
        console.log(this.employeeWarnings);
      },
      error: (err) => {
        console.error('Error loading warnings:', err);
      }
    });
  }

  loadRoles(): void {

    this.apiService.get_roles().subscribe({

      next: (response) => {
        this.roles = [...response] as role[];
        console.log(this.roles);
      },
      error: (err) => {
        console.error('Error loading roles:', err);
      }
    });
  }

  loadTitles(): void {

    this.apiService.getTitles().subscribe({

      next: (response) => {
        this.titles = [...response] as title[];
        console.log(this.titles);
      },
      error: (err) => {
        console.error('Error loading titles:', err);
      }
    });
  }

  searchCustomers($event:any) {
     if($event.target.value == "")
    {
      this.customers = this.staticCustomers;
    }
    else
    {
      this.customers = this.customers.filter(x =>
        (x.customer?.customer_id && x.customer?.customer_id == $event.target.value) ||
        (x.title?.title_name && x.title?.title_name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.name && x.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.surname && x.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.email_address && x.email_address.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.phone_number && x.phone_number.includes($event.target.value)) ||
        (x.customer?.company_name && x.customer?.company_name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.customer?.telephone && x.customer?.telephone.includes($event.target.value))
      );
    }
  }

  searchEmployees($event:any) {
     if($event.target.value == "")
    {
      this.employees = this.staticEmployees;
    }
    else
    {
      this.employees = this.employees.filter(x =>
        (x.employee?.employee_id && x.employee?.employee_id == $event.target.value) ||
        (x.title?.title_name && x.title?.title_name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.name && x.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.surname && x.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.role?.role_name && x.role?.role_name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.email_address && x.email_address.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.phone_number && x.phone_number.includes($event.target.value))
      )
    }
  }

  async viewEmployee(employee:user) {
      this.viewingEmployee = employee;
      //await this.setViewingImage(employee.user?.image);
      this.warningCount = this.employeeWarnings.filter(warning => warning.employee_id === this.viewingEmployee.employee?.employee_id).length;
      this.showEmployeeModal = true;
      console.log(this.viewingEmployee);
  }

  async viewUpdateCustomer(customer?: user): Promise<void> {
    console.log('viewUpdateCustomer called with:', customer);

    if (customer) {
      this.viewingCustomer = customer;
    }

    this.showUpdateCustomerModal = true;
    this.loadTitles(); // Make sure titles are loaded

    // Pre-populate the form EXACTLY like employee form
    this.updateCustomerForm.patchValue({
      title: this.viewingCustomer.title_id,
      name: this.viewingCustomer.name,
      surname: this.viewingCustomer.surname,
      email_address: this.viewingCustomer.email_address,
      phone_number: this.viewingCustomer.phone_number,
      company_name: this.viewingCustomer.customer?.company_name,
      telephone: this.viewingCustomer.customer?.telephone,
      registration_number: this.viewingCustomer.customer?.registration_number,
      vat_number: this.viewingCustomer.customer?.vat_number,
      address: this.viewingCustomer.customer?.address
    });

    console.log('Update Customer Modal opened for:', this.viewingCustomer.name);
    console.log('Form values set:', this.updateCustomerForm.value);
  }

  async updateCustomer(): Promise<void> {
    // Mark all fields as touched to trigger validation messages
    this.markFormGroupTouched(this.updateCustomerForm);

    console.log('Form validation status:', this.updateCustomerForm.valid);
    console.log('Form errors:', this.updateCustomerForm.errors);

    // Check if form is valid
    if (!this.updateCustomerForm.valid) {
      this.notification.showError('Please correct all validation errors before submitting');

      // Log individual field errors for debugging
      Object.keys(this.updateCustomerForm.controls).forEach(key => {
        const control = this.updateCustomerForm.get(key);
        if (control?.invalid) {
          console.log(`Field ${key} errors:`, control.errors);
        }
      });

      return;
    }

    if (!this.viewingCustomer.user_id || !this.viewingCustomer.customer?.customer_id) {
      this.notification.showError('Invalid customer data. Please refresh and try again.');
      return;
    }

    this.customerIdToUpdate = this.viewingCustomer.customer.customer_id;

    // Prepare user update payload
    const userToUpdate = {
      title_id: this.updateCustomerForm.value.title,
      name: this.updateCustomerForm.value.name.trim(),
      surname: this.updateCustomerForm.value.surname.trim(),
      email_address: this.updateCustomerForm.value.email_address.trim().toLowerCase(),
      phone_number: this.updateCustomerForm.value.phone_number.trim(),
      uuid: this.viewingCustomer.uuid,
      image: this.viewingCustomer.image,
      is_employee: false,
      role_id: this.viewingCustomer.role_id
    };

    // Prepare customer update payload
    const customerToUpdate = {
      user_id: this.viewingCustomer.user_id,
      company_name: this.updateCustomerForm.value.company_name.trim(),
      telephone: this.updateCustomerForm.value.telephone.trim(),
      registration_number: this.updateCustomerForm.value.registration_number.trim(),
      vat_number: this.updateCustomerForm.value.vat_number.trim(),
      address: this.updateCustomerForm.value.address.trim()
    };

    console.log('Updating user with:', userToUpdate);
    console.log('Updating customer with:', customerToUpdate);

    // Show loading state
    this.isloading = true;

    // Update user first
    this.apiService.update_user(this.viewingCustomer.user_id, userToUpdate).subscribe({
      next: (res) => {
        console.log('User update response:', res);
        this.notification.showSuccess('Personal details updated successfully');

        // Then update customer details
        this.apiService.update_customer(this.customerIdToUpdate, customerToUpdate).subscribe({
          next: (cRes) => {
            console.log('Customer update response:', cRes);
            this.notification.showSuccess('Company details updated successfully');
            this.showUpdateCustomerModal = false;
            this.isloading = false;
            this.loadUsers(); // Refresh the list
          },
          error: (error) => {
            console.error('Customer update error:', error);
            this.isloading = false;
            const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
            this.notification.showError('Failed to update company details: ' + errorMessage);
          }
        });
      },
      error: (error) => {
        console.error('User update error:', error);
        this.isloading = false;
        const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
        this.notification.showError('Failed to update personal details: ' + errorMessage);
      }
    });
  }

  selectedTabChange(index:number) {
    this.selectedTabIndex = index;
    console.log(this.selectedTabIndex);
  }

  async createCustomer() {

  }


  async viewCustomer(customer:user) {
      this.viewingCustomer = customer;
      //await this.setViewingImage(employee.user?.image);
      this.showCustomerModal = true;
  }


  async createUser(user:user) {



  }

  async viewCreate(index:number) {
    if(index == 0){
      this.showCreateCustomerModal = true;
      this.loadRoles();
      this.loadTitles();
    }
    else{
      this.showCreateEmployeeModal = true;
      this.loadRoles();
      this.loadTitles();
    }
  }

  onTitleChange(event:any): void {
    const value = event.target.value;
    this.selectedTitle = this.titles[value].title_id;
    console.log('Selected title:', value, this.selectedTitle);
  }

  onRoleChange(value: number): void {
    this.selectedRole = this.roles[value].role_id;
    console.log('Selected role:', value, this.selectedRole);
  }

  async viewUploadPayslip(value?: number) {
      this.employeePayslipId = this.viewingEmployee.employee?.employee_id;
      this.showUploadPayslipModal = true;
      console.log(this.employeePayslipId);
  }

  beforeUpload = (file: NzUploadFile,$event:any): boolean => {
    this.fileList = this.fileList.concat(file);
    this.file = this.fileList[0];
    return false;
  };

  async createPayslip() {

    this.showUploadPayslipModal = false;

    const file_url = await this.supabase.uploadFileToStorage(this.file!,"payslips");

    let payslipToInsert = new insertEmployeePaySlip();
    payslipToInsert.employee_id = this.viewingEmployee.employee?.employee_id;
    payslipToInsert.salary = 0;
    payslipToInsert.payslip_url = file_url;

    this.apiService.create_employee_pay_slip(payslipToInsert).subscribe({
        next: res => {
          this.createdPayslip.emit(this.employee.employee?.employee_id)
          this.notification.showSuccess("Payslip successfully uploaded");
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while processing your upload");
          this.isloading = false;
        }
      });
  }

  async viewWarnEmployee(value?: number) {
      this.showWarnEmployeeModal = true;
  }

  async createWarn() {
    let warnToInsert = new employeeWarning();

    if(this.warningForm.value.warning_type = "Verbal"){
      warnToInsert.employee_warning_type_id = 1;
    } else if(this.warningForm.value.warning_type = "Written"){
      warnToInsert.employee_warning_type_id = 2;
    }

        warnToInsert.employee_id = this.viewingEmployee.employee!.employee_id;
        warnToInsert.reason = this.warningForm.value.reason;
        warnToInsert.employee = this.viewingEmployee.employee;
        warnToInsert.is_disputed = false;

        this.apiService.create_employee_warning(warnToInsert).subscribe({
        next: res => {
          this.notification.showSuccess("Warning successfully created");
          this.isloading = false;
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while processing your creation");
          this.isloading = false;
        }
      });

        console.log(warnToInsert);
  }

  async viewDisableEmployee(value?: number) {
      this.showDisableEmployeeModal = true;
  }

  async closeDisableEmployee(value?: number) {
      this.showDisableEmployeeModal = false;
  }

  async disableEmployee() {

    let empToDisable = new user();

    empToDisable.name = this.viewingEmployee.name;
    empToDisable.surname = this.viewingEmployee.surname;
    empToDisable.email_address = this.viewingEmployee.email_address;
    empToDisable.phone_number = this.viewingEmployee.phone_number;
    empToDisable.title_id = this.viewingEmployee.title_id;
    empToDisable.image = this.viewingEmployee.image;
    empToDisable.is_employee = this.viewingEmployee.is_employee;
    empToDisable.uuid = this.viewingEmployee.uuid;
    empToDisable.role_id = 7;

    this.apiService.update_user(this.viewingEmployee.user_id, empToDisable).subscribe({
        next: res => {
          this.notification.showSuccess("Account successfully disabled");
          this.isloading = false;
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while disabling the account");
          this.isloading = false;
        }
      });

      console.log(empToDisable);

      this.showDisableEmployeeModal = false;

  }

  async viewUpdateEmployee(value?: number) {
      this.showUpdateEmployeeModal = true;
      this.loadRoles();
      this.loadTitles();

      this.updateEmployeeForm.controls['name'].setValue(this.viewingEmployee.name);
      this.updateEmployeeForm.controls['surname'].setValue(this.viewingEmployee.surname);
      this.updateEmployeeForm.controls['email_address'].setValue(this.viewingEmployee.email_address);
      this.updateEmployeeForm.controls['phone_number'].setValue(this.viewingEmployee.phone_number);
      this.updateEmployeeForm.controls['name'].setValue(this.viewingEmployee.name);
      this.updateEmployeeForm.controls['address'].setValue(this.viewingEmployee.employee?.address);
      this.updateEmployeeForm.controls['job_scope'].setValue(this.viewingEmployee.employee?.job_scope);
      this.updateEmployeeForm.controls['hourly_rate'].setValue(this.viewingEmployee.employee?.hourly_rate);
      this.updateEmployeeForm.controls['emergency_contact'].setValue(this.viewingEmployee.employee?.emergency_contact);
      this.updateEmployeeForm.controls['title'].setValue(this.viewingEmployee.title?.title_name);
      this.updateEmployeeForm.controls['role'].setValue(this.viewingEmployee.role?.role_name);
  }

// Enhanced createEmployee method with validation
async createEmployee(): Promise<void> {
  // Mark all fields as touched to trigger validation messages
  this.markFormGroupTouched(this.employeeForm);

  if (!this.employeeForm.valid) {
    this.notification.showError('Please correct all validation errors before submitting');
    return;
  }

  let userToInsert = new insertUser();
  let employeeToInsert = new insertEmployee();

  userToInsert.title_id = this.employeeForm.value.title;
  userToInsert.role_id = this.employeeForm.value.role;
  userToInsert.name = this.employeeForm.value.name.trim();
  userToInsert.surname = this.employeeForm.value.surname.trim();
  userToInsert.email_address = this.employeeForm.value.email_address.trim().toLowerCase();
  userToInsert.phone_number = '27' + this.employeeForm.value.phone_number.trim();
  userToInsert.uuid = "a4952d0b-80d0-47f8-816f-dfce57e43d1f";
  userToInsert.image = "0";
  userToInsert.is_employee = true;

  employeeToInsert.address = this.employeeForm.value.address.trim();
  employeeToInsert.emergency_contact = this.employeeForm.value.emergency_contact.trim();
  employeeToInsert.job_scope = this.employeeForm.value.job_scope.trim();
  employeeToInsert.hourly_rate = this.employeeForm.value.hourly_rate;

  this.isloading = true;

  this.apiService.create_user(userToInsert).subscribe({
    next: res => {
      this.createdUser.emit();
      employeeToInsert.user_id = res.user_id;

      this.apiService.create_employee(employeeToInsert).subscribe({
        next: res => {
          this.notification.showSuccess("Employee successfully created");
          this.showCreateEmployeeModal = false;
          this.isloading = false;
          this.loadUsers();
        },
        error: (error) => {
          this.notification.showError("An Error Occurred while creating employee");
          this.isloading = false;
        }
      });
    },
    error: (error) => {
      this.notification.showError("An Error Occurred while creating user");
      this.isloading = false;
    }
  });
}

// Enhanced updateEmployee method with validation
async updateEmployee(): Promise<void> {
  // Mark all fields as touched to trigger validation messages
  this.markFormGroupTouched(this.updateEmployeeForm);

  if (!this.updateEmployeeForm.valid) {
    this.notification.showError('Please correct all validation errors before submitting');
    return;
  }

  if (!this.viewingEmployee.user_id || !this.viewingEmployee.employee?.employee_id) {
    this.notification.showError('Invalid employee data');
    return;
  }

  this.employeeIdToUpdate = this.viewingEmployee.employee.employee_id;

  let userToUpdate = new insertUser();
  let employeeToUpdate = new insertEmployee();

  userToUpdate.name = this.updateEmployeeForm.value.name.trim();
  userToUpdate.surname = this.updateEmployeeForm.value.surname.trim();
  userToUpdate.email_address = this.updateEmployeeForm.value.email_address.trim().toLowerCase();
  userToUpdate.phone_number = this.updateEmployeeForm.value.phone_number.trim();
  userToUpdate.uuid = this.viewingEmployee.uuid;
  userToUpdate.image = this.viewingEmployee.image;
  userToUpdate.is_employee = this.viewingEmployee.is_employee;
  userToUpdate.title_id = this.updateEmployeeForm.value.title;
  userToUpdate.role_id = this.updateEmployeeForm.value.role;

  employeeToUpdate.user_id = this.viewingEmployee.user_id;
  employeeToUpdate.job_scope = this.updateEmployeeForm.value.job_scope.trim();
  employeeToUpdate.address = this.updateEmployeeForm.value.address.trim();
  employeeToUpdate.emergency_contact = this.updateEmployeeForm.value.emergency_contact.trim();
  employeeToUpdate.hourly_rate = this.updateEmployeeForm.value.hourly_rate;

  this.isloading = true;

  this.apiService.update_user(this.viewingEmployee.user_id, userToUpdate).subscribe({
    next: res => {
      this.notification.showSuccess("User successfully updated");

      this.apiService.update_employee(this.employeeIdToUpdate, employeeToUpdate).subscribe({
        next: res => {
          this.notification.showSuccess("Employee successfully updated");
          this.showUpdateEmployeeModal = false;
          this.isloading = false;
          this.loadUsers();
        },
        error: (error) => {
          this.notification.showError("An Error Occurred while updating employee");
          this.isloading = false;
        }
      });
    },
    error: (error) => {
      this.notification.showError("An Error Occurred while updating user");
      this.isloading = false;
    }
  });
}

// Helper method to mark form as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormControl) {
        control.markAsTouched();
      } else if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  }


