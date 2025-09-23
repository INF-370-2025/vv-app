import { role, roleClaim, roleClaimLine } from "./role";
import { title } from "./title";


export class user {
  user_id!:number;
  created_at!:Date;
  role_id!:number;
  role?:role;
  title_id!:number;
  title?:title;
  name!:string;
  surname!:string;
  email_address!:string;
  phone_number!:string;
  image!:string;
  uuid!:string;
  is_employee?:boolean;
  employee?:employee;
  customer?:customer;
  claims?:roleClaimLine[] | [];
  first_name: any;
  last_name: any;
}

export class insertUser {
  role_id!:number;
  title_id!:number;
  name!:string;
  surname!:string;
  email_address!:string;
  phone_number!:string;
  image!:string;
  uuid?:string;
  is_employee?:boolean;
}

export class customer {
  customer_id!:number;
  created_at!:Date;
  user_id!:number;
  user?:user;
  role?:role;
  customer_type_id?:number;
  customer_type?:customerType;
  company_name!:string;
  registration_number!:string;
  vat_number!:string;
  address!:string;
  telephone!:string;
}


export class addCustomer {
  title_id!:number;
  name!:string;
  surname!:string;
  email_address!:string;
  phone_number!:string;
  company_name!:string;
  telephone!:string;
  registration_number!:string;
  vat_number!:string;
  address!:string;
}


export class customerType {
  customer_type_id!:number;
  created_at!:Date;
  type_name!:string;
}

export class employee {
  employee_id!:number;
  created_at!:Date;
  job_scope!:string;
  address!:string;
  emergency_contact!:string;
  hourly_rate!:string;
  user?:user;
  employee_payslips?:employeePayslip[];
  employee_time_logs?:employeTimeLog[];
  employee_warnings?:employeeWarning[];
}

export class employeePayslip {


}

export class employeTimeLog {
  employee_time_log_id!:number;
  clock_in!:Date;
  clock_out!:Date;
  employee?:employee;
}

export class employeeWarning {
  employee_warning_id!:number;
  reason!:string;
  employee_warning_type_id!:number;
  employee_id!:number;
  is_disputed!:boolean;
  employee?:employee;
}

export class employeeWarningTypeId {


}

export class insertEmployeePaySlip {
  employee_pay_slip_id!:number;
  employee_id?:number;
  salary!:number;
  payslip_url!:string;
}

export class insertEmployee {
  job_scope!:string;
  address!:string;
  user_id!:number;
  emergency_contact!:string;
  hourly_rate!:number;
}

export class insertCustomer{
  company_name!:string;
  telephone!:string;
  registration_number!:string;
  vat_number!:string;
  address!:string;
  //customer_type_id!:number;
  user_id!:number;
}
