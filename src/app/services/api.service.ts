import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { contact } from '../models/general';
import { insertJobRequest, jobRequest } from '../models/jobRequest';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  //#region Default

    send_email(email: any) {
      return this.http.post<any>(environment.api_url + 'send-email', email)
    }

  //#region Customers

    customers_ep = 'customers';

    get_customers() {
      return this.http.get<any>(environment.api_url + this.customers_ep + `/get_customers`)
    }

    get_customer_types() {
      return this.http.get<any>(environment.api_url + this.customers_ep + `/get_customer_types`)
    }

    create_customer(customer: any) {
      return this.http.post<any>(environment.api_url + this.customers_ep + '/create_customer', customer);
    }


  //#endregion

  //#region Roles

    roles_ep = 'roles';

    get_roles() {
      return this.http.get<any>(environment.api_url + this.roles_ep + `/get_roles`)
    }

    create_role(role: any){
      return this.http.post<any>(
      environment.api_url + this.roles_ep + '/create_role',
      role
    );
    }

    get_role_claims() {
      return this.http.get<any>(environment.api_url + this.roles_ep + `/get_role_claims`)
    }

    get_role_claim_lines() {
      return this.http.get<any>(environment.api_url + this.roles_ep + `/get_role_claim_lines`)
    }

    create_role_claim_line(role_claim_line: any){
      return this.http.post<any>(
      environment.api_url + this.roles_ep + '/create_role_claim_line',
      role_claim_line
    );
    }

    update_role_claim_line(role_claim_id: number, role_id: number, role_claim_line: any) {
    return this.http.put<any>(
      environment.api_url + this.roles_ep + `/update_role_claim_line/${role_claim_id}/${role_id}`,
      role_claim_line
    );
  }

  //#endregion

  //#region Employees

    employees_ep = 'employees';

    get_employees() {
      return this.http.get<any>(environment.api_url + this.employees_ep + `/get_employees`)
    }

    get_employee_warnings() {
      return this.http.get<any>(environment.api_url + this.employees_ep + `/get_employee_warnings`)
    }

    create_employee_pay_slip(employee_pay_slip: any){
      return this.http.post<any>(
      environment.api_url + this.employees_ep + '/create_pay_slip',
      employee_pay_slip
    );
    }

    create_employee_warning(employee_warning: any){
      return this.http.post<any>(
      environment.api_url + this.employees_ep + '/create_employee_warning',
      employee_warning
    );
    }

    update_employee(employee_id: number, employee: any) {
    return this.http.put<any>(
      environment.api_url +  this.employees_ep + `/update_employee/${employee_id}`,
      employee
    );
    }

    create_employee(employee: any){
      return this.http.post<any>(
      environment.api_url + this.employees_ep + '/create_employee',
      employee
    );
    }

    get_time_logs() {
      return this.http.get<any>(environment.api_url +  this.employees_ep + `/get_time_logs`)
    }

    // clock_in(employee_id: number) {
    //   return this.http.get<any>(environment.api_url +  this.employees_ep  + `/clock_in/${employee_id}`)
    // }

    // clock_out(employee_id: number) {
    //   return this.http.get<any>(environment.api_url + this.employees_ep  + `/clock_out/${employee_id}`)
    // }

    get_artisans() {
      return this.http.get<any>(
      environment.api_url + this.employees_ep + '/get_artisans'
      );
   }

  //#endregion

  //#region Users

    users_ep = 'users';

    get_users() {
      return this.http.get<any>(environment.api_url + this.users_ep + `/get_users`)
    }

    create_user(user: any) {
      return this.http.post<any>(
      environment.api_url +  this.users_ep + '/create_user',
      user
    );
    }

    update_user(user_id: number, user: any) {
    return this.http.put<any>(
      environment.api_url +  this.users_ep + `/update_user/${user_id}`,
      user
    );
    }

    get_profile_employee(user_id: number) {
      return this.http.get<any>(environment.api_url + this.users_ep + `/get_user_employee/${user_id}`)
    }

    get_profile_customer(user_id: number) {
      return this.http.get<any>(environment.api_url + this.users_ep + `/get_user_customer/${user_id}`)
    }

  //#endregion

  //#region Job-requests

    job_requests_ep = 'job_requests';

    getJobRequests() {
      return this.http.get<any>(environment.api_url + this.job_requests_ep + `/get_job_requests`)
    }

    get_job_requests_user(user_id:number) {
      return this.http.get<any>(environment.api_url + this.job_requests_ep + `/get_job_requests_user/${user_id}`)
    }

    rejectJob(job_request_id:number) {
      return this.http.get<any>(environment.api_url + this.job_requests_ep + `/reject_job_request/${job_request_id}`)
    }

    create_job_request(job_request:insertJobRequest) {
      return this.http.post<any>(environment.api_url + this.job_requests_ep + `/create_job_request`,job_request)
    }

    cancel_job_request(job_request_id: number) {
      return this.http.put<any>(environment.api_url + this.job_requests_ep + `/cancel_job_request/${job_request_id}`,
        { job_request_status_id: 4 }
      );
    }

  //#endregion

  //#region Job-Cards

  job_cards_ep = 'job_cards';

  get_job_card_statuses(){
    return this.http.get<any>(environment.api_url + this.job_cards_ep + `/get_job_card_statuses`)
  }

  get_job_card_status(job_card_status_id: number) {
    return this.http.get<any>(
      environment.api_url +  this.job_cards_ep + `/get_job_card_status/${job_card_status_id}`
    );
  }

  get_job_cards(){
    return this.http.get<any>(environment.api_url + this.job_cards_ep + `/get_job_cards`)
  }

  get_job_card(job_card_id: number) {
    return this.http.get<any>(
      environment.api_url +  this.job_cards_ep + `/get_job_card/${job_card_id}`
    );
  }

  get_job_update_card(job_card_id: number) {
    return this.http.get<any>(
      environment.api_url +  this.job_cards_ep + `/get_job_card_update/${job_card_id}`
    );
  }

  create_job_card(jobCardData: any) {
    return this.http.post<any>(
      environment.api_url +  this.job_cards_ep + '/create_job_card',
      jobCardData
    );
  }

  update_job_card(job_card_id: number, job_card: any) {
    return this.http.put<any>(
      environment.api_url + this.job_cards_ep + `/update_job_card/${job_card_id}`,
      job_card
    );
  }

  get_job_card_with_materials(job_card_id: number) {
    return this.http.get<any>(
      environment.api_url + this.job_cards_ep + `/get_job_card_with_materials/${job_card_id}`
    );
  }

  get_completed_job_cards(){
    return this.http.get<any>(environment.api_url + this.job_cards_ep + `/get_completed_job_cards`)
  }



//#endregion

  //#region Quotations

  quotations_ep = 'quotations';
  quotation_statuses_ep = 'quotation_statuses';

  get_quotation_statuses(){
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/get_quotation_statuses`)
  }



  get_quotation_status(quotation_status_id: number) {
    return this.http.get<any>(
      environment.api_url + this.quotation_statuses_ep + `/get_quotation_status/${quotation_status_id}`
    );
  }

  get_quotations(){
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/get_quotations`)
  }

  get_quotations_user(user_id:number){
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/get_quotations_user/${user_id}`)
  }

  get_quotation(quotation_id: number) {
    return this.http.get<any>(
      environment.api_url + this.quotations_ep + `/get_quotation/${quotation_id}`
    );
  }

  create_quotation(quotation: any) {
    return this.http.post<any>(
      environment.api_url + this.quotations_ep + '/create_quotation',
      quotation
    );
  }

  update_quotation(quotation_id: number, quotation: any) {
    return this.http.put<any>(
      environment.api_url +  this.quotations_ep + `/update_quotation/${quotation_id}`,
      quotation
    );
  }

  accept_quote(quotation_id: number) {
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/accept_quotation/${quotation_id}`);
  }


  reject_quote(quotation_id: number) {
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/reject_quotation/${quotation_id}`);
  }

  get_pending_quotes() {
    return this.http.get<any>(
      environment.api_url + this.quotations_ep + '/pending_quotes');
  }



//#endregion

  //#region Invoices

  invoices_ep = 'invoices';

  get_invoices(){
    return this.http.get<any>(environment.api_url + this.invoices_ep + `/get_invoices`)
  }

  update_invoice(invoice_id: number, invoice: any) {
    return this.http.put<any>(
      environment.api_url +  this.invoices_ep + `/update_invoice/${invoice_id}`,
      invoice
    );
    }

    get_invoices_user(user_id:number){
    return this.http.get<any>(environment.api_url + this.invoices_ep + `/get_invoices_user/${user_id}`)
  }

  update_invoice_status(invoice_id: number) {
    return this.http.put<any>(
      environment.api_url + this.invoices_ep + `/update_invoice_status/${invoice_id}`,
      {}
    );
  }

  create_invoice(payload: any) {
    return this.http.post<any>(
      environment.api_url +  this.invoices_ep + '/create_invoice',
      payload
    );
  }


  get_unpaid_invoices() {
    return this.http.get<any>(
      environment.api_url + this.invoices_ep + '/unpaid_invoices');
  }

  //#endregion

  //#region Receipts

    get_receipts_ep = 'receipts';

    get_receipts(){
      return this.http.get<any>(environment.api_url + this.get_receipts_ep +`/get_receipts`)
    }

    get_receipt(receipt_id: number) {
      return this.http.get<any>(
        environment.api_url + this.get_receipts_ep + `receipts/get_receipt/${receipt_id}`
      );
    }

    create_receipt(receipt: any) {
      return this.http.post<any>(
        environment.api_url + this.get_receipts_ep + 'receipts/create_receipt',
        receipt
      );
    }

  //#endregion

  //#region General

    general_ep = 'general';

    get_faqs() {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_faqs`);
    }

    getTitles() {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_titles`)
    }

    contactUs(contact:contact)
    {
      return this.http.post(environment.api_url +  this.general_ep + "/contact_us", contact);
    }

    getAdminStats() {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_admin_stats`)
    }

    getArtisanStats(user_id:number) {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_artisan_stats/${user_id}`)
    }

    // Add to your ApiService
    get_artisan_stats(job_card_id: number) {
      return this.http.get<any>(
        environment.api_url + this.general_ep + `/get_artisan_stats/${job_card_id}`
      );
    }



  //#endregion

  //#region Stock

    stock_ep = 'stock';
    //stock_type_ep = 'stock_type'

    get_stock_types() {
      return this.http.get<any>(environment.api_url + this.stock_ep + `/get_stock_types`);
    }


    get_stock_type(stock_type_id: number) {
      return this.http.get<any>(
        environment.api_url + this.stock_ep + `/get_stock_type/${stock_type_id}`
      );
    }

    get_all_stock() {
      return this.http.get<any>(environment.api_url + this.stock_ep + `/get_all_stock`);
    }


    get_stock(stock_id: number) {
      return this.http.get<any>(
        environment.api_url + this.stock_ep + `/get_stock/${stock_id}`
      );
    }

    get_stock_categories() {
      return this.http.get<any>(environment.api_url + this.stock_ep + `/get_stock_categories`);
    }

    create_stock(stock: any) {
      return this.http.post<any>(
        environment.api_url + this.stock_ep + '/create_stock',
        stock
      );
    }

    update_stock(stock: any) {
      return this.http.put<any>(
        environment.api_url + this.stock_ep + `/update_stock/${stock.stock_id}`,
        stock
      );
    }

  export_stock_to_excel(): Observable<Blob> {
    return this.http.get(
      environment.api_url + this.stock_ep + `/export_stock_excel`,
      { responseType: 'blob' }  // Crucial for handling Excel files
    );
  }

  //#endregion

  //#region Pattern

    pattern_ep = 'pattern';

    get_patterns() {
      return this.http.get<any>(environment.api_url + this.pattern_ep + `/get_patterns`);
    }


    get_pattern(pattern_id: number) {
      return this.http.get<any>(
        environment.api_url + this.pattern_ep + `/get_pattern/${pattern_id}`
      );
    }

    get_pattern_types() {
      return this.http.get<any>(environment.api_url + this.pattern_ep + `/get_pattern_types`);
    }


    get_pattern_type(pattern_type_id: number) {
      return this.http.get<any>(
        environment.api_url + this.pattern_ep + `/get_pattern_type/${pattern_type_id}`
      );
    }

    create_pattern(pattern: any) {
      return this.http.post<any>(
        environment.api_url + this.pattern_ep + '/create_pattern',
        pattern
      );
    }

    delete_pattern(pattern_id: number) {
    return this.http.delete<any>(
      environment.api_url + this.pattern_ep  + `/delete_delivery_note/${pattern_id}`
    );
  }

  //#endregion

  //#region Material
    material_ep = 'material'

    get_materials() {
      return this.http.get<any>(environment.api_url + this.material_ep + `/get_materials`);
    }


    get_material(material_id: number) {
      return this.http.get<any>(
        environment.api_url + this.pattern_ep + `/get_material/${material_id}`
      );
    }

    export_material_to_excel(): Observable<Blob> {
      return this.http.get(
        environment.api_url + this.material_ep + `/export_material_excel`,
        { responseType: 'blob' }
      );
    }

    import_material_excel(file: File): Observable<any> {
      const formData = new FormData();
      formData.append('file', file);

      return this.http.post(
        environment.api_url + this.material_ep + `/import_material_excel`,
        formData,
        { reportProgress: true }
      );
    }

  //#endregion

  //#region Delivery Notes
  delivery_note_ep = 'delivery_notes';

  get_delivery_notes(){
    return this.http.get<any>(environment.api_url + this.delivery_note_ep + `/get_delivery_notes`)
  }

  get_delivery_note(delivery_note_id: number) {
    return this.http.get<any>(
      environment.api_url +  this.delivery_note_ep + `/get_delivery_note/${delivery_note_id}`
    );
  }

  create_delivery_note(delivery_note: any) {
    return this.http.post<any>(
      environment.api_url +  this.delivery_note_ep + '/create_delivery_note',
      delivery_note
    );
  }

  delete_delivery_note(delivery_note_id: number) {
    return this.http.delete<any>(
      environment.api_url + this.delivery_note_ep  + `/delete_delivery_note/${delivery_note_id}`
    );
  }

  get_delivery_notes_user(user_id:number) {
    return this.http.get<any>(environment.api_url + this.delivery_note_ep + `/get_devlivery_notes_user/${user_id}`)
  }

  //#endregion

  //#region employee time logs
  employee_time_logs_ep = 'employee_time_logs';

  get_monthly_hours_worked(year: number) {
    return this.http.get<any>(
      environment.api_url + this.employee_time_logs_ep + `/monthly_hours_worked?year=${year}`
    );
  }


  generateClockCode(type: 'clock_in' | 'clock_out'): Observable<{ code: number, expires_at: string }> {
    return this.http.post<{ code: number, expires_at: string }>(
      environment.api_url + this.employee_time_logs_ep + '/generate-clock-code',
      { type }
    );
  }


  clock_in(employee_id: number) {
    return this.http.get<any>(environment.api_url + this.employee_time_logs_ep + `/clock_in/${employee_id}`);
  }

  clock_out(employee_id: number) {
    return this.http.get<any>(environment.api_url + this.employee_time_logs_ep + `/clock_out/${employee_id}`);
  }


  verifyClockCode(employeeId: number, code: number, type: 'clock_in' | 'clock_out'): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(
      environment.api_url + this.employee_time_logs_ep + '/verify-clock-code',
      { employee_id: employeeId, code, type }
    );
  }

  //#endregion


}
