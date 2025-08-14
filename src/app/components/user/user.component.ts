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

  i: number = 1;
  j: number = 1;

  @Input() employee : user = new user();
  @Output() createdPayslip = new EventEmitter<number>();
  @Output() createdUser = new EventEmitter<number>();

  employeeForm:FormGroup = new FormGroup({
      title: new FormControl(null, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      surname: new FormControl(null, [Validators.required]),
      email_address: new FormControl(null, [Validators.required]),
      phone_number: new FormControl(null, [Validators.required]),
      role: new FormControl(null, [Validators.required]),
      address: new FormControl(null, [Validators.required]),
      emergency_contact: new FormControl(null, [Validators.required]),
      hourly_rate: new FormControl(null, [Validators.required]),
      job_scope: new FormControl(null, [Validators.required]),
    });

    updateEmployeeForm:FormGroup = new FormGroup({
      title: new FormControl(null, [Validators.required]),
      name: new FormControl(null, [Validators.required]),
      surname: new FormControl(null, [Validators.required]),
      email_address: new FormControl(null, [Validators.required]),
      phone_number: new FormControl(null, [Validators.required]),
      role: new FormControl(null, [Validators.required]),
      address: new FormControl(null, [Validators.required]),
      emergency_contact: new FormControl(null, [Validators.required]),
      hourly_rate: new FormControl(null, [Validators.required]),
      job_scope: new FormControl(null, [Validators.required]),
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
      console.log(this.warningCount);
  }

  async viewCustomer(customer:user) {
      this.viewingCustomer = customer;
      //await this.setViewingImage(employee.user?.image);
      this.showCustomerModal = true;
  }

  selectedTabChange(index:number) {
    this.selectedTabIndex = index;
    console.log(this.selectedTabIndex);
  }

  async createCustomer() {

  }

  async createEmployee() {

    let userToInsert = new insertUser();

    let employeeToInsert = new insertEmployee();

    userToInsert.title_id = this.employeeForm.value.title;
    userToInsert.role_id = this.employeeForm.value.role;
    userToInsert.name = this.employeeForm.value.name;
    userToInsert.surname = this.employeeForm.value.surname;
    userToInsert.email_address = this.employeeForm.value.email_address;
    userToInsert.phone_number = 27 + this.employeeForm.value.phone_number;
    userToInsert.uuid = "a4952d0b-80d0-47f8-816f-dfce57e43d1f";
    userToInsert.image = "0";
    userToInsert.is_employee = true;

    employeeToInsert.address = this.employeeForm.value.address;
    employeeToInsert.emergency_contact = this.employeeForm.value.emergency_contact;
    employeeToInsert.job_scope = this.employeeForm.value.job_scope;
    employeeToInsert.hourly_rate = this.employeeForm.value.hourly_rate;

    this.apiService.create_user(userToInsert).subscribe({
        next: res => {
          this.createdUser.emit();
          console.log(userToInsert);
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while creating");
          this.isloading = false;
        }
      });

      this.loadUsers();
        this.employees.sort((a, b) => b.user_id - a.user_id);
        employeeToInsert.user_id = this.employees[0].user_id;

    this.apiService.create_employee(employeeToInsert).subscribe({
      next: res => {
        this.notification.showSuccess("Employee successfully created");
        this.showCreateEmployeeModal = false;
        console.log(employeeToInsert);
      },
      error: (error) => {
        this.notification.showError("An Error Occoured while creating");
        this.isloading = false;
        console.log(employeeToInsert);
      }
    });

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

  async updateEmployee() {

    this.employeeIdToUpdate = this.viewingEmployee.employee!.employee_id;

    let userToUpdate = new insertUser();

    let employeeToUpdate = new insertEmployee();

    userToUpdate.name = this.updateEmployeeForm.value.name;
    userToUpdate.surname = this.updateEmployeeForm.value.surname;
    userToUpdate.email_address = this.updateEmployeeForm.value.email_address;
    userToUpdate.phone_number = this.updateEmployeeForm.value.phone_number;
    userToUpdate.uuid = this.viewingEmployee.uuid;
    userToUpdate.image = this.viewingEmployee.image;
    userToUpdate.is_employee = this.viewingEmployee.is_employee;

    userToUpdate.title_id = this.updateEmployeeForm.value.title;
    userToUpdate.role_id = this.updateEmployeeForm.value.role;

    employeeToUpdate.user_id = this.viewingEmployee.user_id;
    employeeToUpdate.job_scope = this.updateEmployeeForm.value.job_scope;
    employeeToUpdate.address = this.updateEmployeeForm.value.address;
    employeeToUpdate.emergency_contact = this.updateEmployeeForm.value.emergency_contact;
    employeeToUpdate.hourly_rate = this.updateEmployeeForm.value.hourly_rate;


    this.apiService.update_user(this.viewingEmployee.user_id, userToUpdate).subscribe({
        next: res => {
          this.notification.showSuccess("User successfully updated");
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while updating");
          this.isloading = false;
        }
      });

      this.apiService.update_employee(this.employeeIdToUpdate, employeeToUpdate).subscribe({
        next: res => {
          this.notification.showSuccess("Employee successfully updated");
          console.log(employeeToUpdate);
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while updating");
          this.isloading = false;
          console.log(employeeToUpdate);
        }
      });

      this.showCreateEmployeeModal = false;
  }
  }


