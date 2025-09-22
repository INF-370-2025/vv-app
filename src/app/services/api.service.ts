// src/app/services/api.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { contact } from '../models/general';
import { insertJobRequest } from '../models/jobRequest';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { customer } from '../models/user';

/** ---------------- Helper to unwrap common API envelopes ----------------
 * Supports:
 *  - { data: {...}, error?: string }
 *  - { data: [ {...} ], error?: string }
 *  - plain {...}
 *  - plain [ {...} ]
 */
type ApiEnvelope<T> = { data?: T | T[]; error?: string; message?: string } | T | T[];

function unwrapRow<T>(res: ApiEnvelope<T>): T | null {
  if (Array.isArray(res)) return (res[0] ?? null) as T | null;     // plain array
  if (res && typeof res === 'object' && !('data' in res)) {
    return res as T;                                               // plain object row
  }
  const r = res as { data?: T | T[]; error?: string };
  if (r?.error) throw new Error(r.error);
  if (Array.isArray(r?.data)) return (r!.data![0] ?? null) as T | null;
  return (r?.data ?? null) as T | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  //#region Default

  send_email(email: any) {
    return this.http.post<any>(environment.api_url + 'send-email', email);
  }

  //#endregion

  //#region Customers

  customers_ep = 'customers';

  get_customers() {
    return this.http.get<any>(environment.api_url + this.customers_ep + `/get_customers`);
  }

  get_customer_types() {
    return this.http.get<any>(environment.api_url + this.customers_ep + `/get_customer_types`);
  }

  create_customer(customer: any) {
    return this.http.post<any>(environment.api_url + this.customers_ep + '/create_customer', customer);
  }

  update_customer(customer_id: number, customer: any) {
    return this.http.put<any>(environment.api_url + this.customers_ep + `/update_customer/${customer_id}`, customer);
  }

  /** Returns the customer row or null (does NOT throw if missing) */
  get_profile_customer_or_null(user_id: number) {
    const url = `${environment.api_url}${this.users_ep}/get_user_customer/${user_id}`;
    return this.http.get<any>(url).pipe(
      map((res: any) => {
        // handle common shapes: {data}, [row], row
        const data = res?.data ?? res;
        if (Array.isArray(data)) return (data[0] ?? null) as customer | null;
        if (data && typeof data === 'object') return (data as customer) ?? null;
        return null;
      })
    );
  }

  /**
   * Creates a minimal/blank customer row for an existing user_id.
   * Adjust required fields if your backend requires more (e.g. customer_type_id).
   */
  create_blank_customer_for_user(user_id: number, seed?: Partial<customer>) {
    const payload = {
      user_id,
      company_name: seed?.company_name ?? '',
      telephone: seed?.telephone ?? '',
      registration_number: seed?.registration_number ?? '',
      vat_number: seed?.vat_number ?? '',
      address: seed?.address ?? ''
      // If your backend needs customer_type_id or others, set them here:
      // customer_type_id: seed?.customer_type_id ?? 1
    };
    return this.create_customer(payload);
  }

  //#endregion

  //#region Roles

  roles_ep = 'roles';

  get_roles() {
    return this.http.get<any>(environment.api_url + this.roles_ep + `/get_roles`);
  }

  get_role(role_id: number) {
    return this.http.get<any>(environment.api_url + this.roles_ep + `/get_role/${role_id}`);
  }

  create_role(role: any) {
    return this.http.post<any>(
      environment.api_url + this.roles_ep + '/create_role',
      role
    );
  }

  update_role(role_id: number, role: any) {
    return this.http.put<any>(
      environment.api_url + this.roles_ep + `/update_role/${role_id}`,
      role
    );
  }

  delete_role(role_id: number) {
    return this.http.delete<any>(environment.api_url + this.roles_ep + `/delete_role/${role_id}`);
  }

  get_role_claims() {
    return this.http.get<any>(environment.api_url + this.roles_ep + `/get_role_claims`);
  }

  get_role_claim_lines() {
    return this.http.get<any>(environment.api_url + this.roles_ep + `/get_role_claim_lines`);
  }

  create_role_claim_line(role_claim_line: any) {
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
    return this.http.get<any>(environment.api_url + this.employees_ep + `/get_employees`);
  }

  get_employee_warnings() {
    return this.http.get<any>(environment.api_url + this.employees_ep + `/get_employee_warnings`);
  }

  create_employee_pay_slip(employee_pay_slip: any) {
    return this.http.post<any>(
      environment.api_url + this.employees_ep + '/create_pay_slip',
      employee_pay_slip
    );
  }

  create_employee_warning(employee_warning: any) {
    return this.http.post<any>(
      environment.api_url + this.employees_ep + '/create_employee_warning',
      employee_warning
    );
  }

  update_employee(employee_id: number, employee: any) {
    return this.http.put<any>(
      environment.api_url + this.employees_ep + `/update_employee/${employee_id}`,
      employee
    );
  }

  create_employee(employee: any) {
    return this.http.post<any>(
      environment.api_url + this.employees_ep + '/create_employee',
      employee
    );
  }

  get_time_logs() {
    return this.http.get<any>(environment.api_url + this.employees_ep + `/get_time_logs`);
  }

    clock_in(employee_id: number) {
      return this.http.get<any>(environment.api_url +  this.employees_ep  + `/clock_in/${employee_id}`)
    }

    clock_out(employee_id: number) {
      return this.http.get<any>(environment.api_url + this.employees_ep  + `/clock_out/${employee_id}`)
    }
  get_artisans() {
    return this.http.get<any>(
      environment.api_url + this.employees_ep + '/get_artisans'
    );
  }

  //#endregion

  //#region Users

  users_ep = 'users';

  get_users() {
    return this.http.get<any>(environment.api_url + this.users_ep + `/get_users`);
  }

  create_user(user: any) {
    return this.http.post<any>(
      environment.api_url + this.users_ep + '/create_user',
      user
    );
  }

  update_user(user_id: number, user: any) {
    return this.http.put<any>(
      environment.api_url + this.users_ep + `/update_user/${user_id}`,
      user
    );
  }

  get_profile_employee(user_id: number) {
    return this.http.get<any>(environment.api_url + this.users_ep + `/get_user_employee/${user_id}`);
  }

  get_profile_customer(user_id: number) {
    return this.http.get<any>(environment.api_url + this.users_ep + `/get_user_customer/${user_id}`);
  }

  /** Clean version (optional): returns the customer row with nested `user` directly, or throws if missing */
  get_profile_customer_clean(user_id: number) {
    const url = `${environment.api_url}${this.users_ep}/get_user_customer/${user_id}`;
    return this.http.get<any>(url).pipe(
      map((res: any) => {
        const row = unwrapRow<customer>(res);
        if (!row) throw new Error('No customer found for this user.');
        if (!row.user) throw new Error('Customer row is missing joined user.');
        return row;
      })
    );
  }

  //#endregion

  //#region Job-requests

  job_requests_ep = 'job_requests';

  getJobRequests() {
    return this.http.get<any>(environment.api_url + this.job_requests_ep + `/get_job_requests`);
  }

  get_job_requests_user(user_id: number) {
    return this.http.get<any>(environment.api_url + this.job_requests_ep + `/get_job_requests_user/${user_id}`);
  }

  rejectJob(job_request_id: number) {
    return this.http.get<any>(environment.api_url + this.job_requests_ep + `/reject_job_request/${job_request_id}`);
  }

  create_job_request(job_request: insertJobRequest) {
    return this.http.post<any>(environment.api_url + this.job_requests_ep + `/create_job_request`, job_request);
  }

  cancel_job_request(job_request_id: number) {
    return this.http.put<any>(environment.api_url + this.job_requests_ep + `/cancel_job_request/${job_request_id}`,
      { job_request_status_id: 4 }
    );
  }

  //#endregion

  //#region Job-Cards

  job_cards_ep = 'job_cards';

  get_invoice_by_quote(quote_id: number) {
    return this.http.get<any>(`/invoices?quote_id=${quote_id}`);
  }


  get_job_card_statuses() {
    return this.http.get<any>(environment.api_url + this.job_cards_ep + `/get_job_card_statuses`);
  }

  get_job_card_status(job_card_status_id: number) {
    return this.http.get<any>(
      environment.api_url + this.job_cards_ep + `/get_job_card_status/${job_card_status_id}`
    );
  }

  get_job_cards() {
    return this.http.get<any>(environment.api_url + this.job_cards_ep + `/get_job_cards`);
  }

  get_job_card(job_card_id: number) {
    return this.http.get<any>(
      environment.api_url + this.job_cards_ep + `/get_job_card/${job_card_id}`
    );
  }

  get_job_update_card(job_card_id: number) {
    return this.http.get<any>(
      environment.api_url + this.job_cards_ep + `/get_job_card_update/${job_card_id}`
    );
  }

  create_job_card(jobCardData: any) {
    return this.http.post<any>(
      environment.api_url + this.job_cards_ep + '/create_job_card',
      jobCardData
    );
  }

  update_job_card(job_card_id: number, job_card: any) {
    return this.http.put<any>(
      environment.api_url +  this.job_cards_ep + `/update_job_card/${job_card_id}`,
      job_card
    );
  }

  get_job_card_with_materials(job_card_id: number) {
    return this.http.get<any>(
      environment.api_url + this.job_cards_ep + `/get_job_card_with_materials/${job_card_id}`
    );
  }

  update_invoice_job_card(invoiceId: number, jobCardId: number): Observable<any> {
    return this.http.put<any>(
      environment.api_url + this.invoices_ep + `/update_invoice_job_card/${invoiceId}/${jobCardId}`,
      {}
    );
  }



  get_completed_job_cards(){
    return this.http.get<any>(environment.api_url + this.job_cards_ep + `/get_completed_job_cards`)
  }

  //#endregion

  //#region Quotations

  quotations_ep = 'quotations';
  quotation_statuses_ep = 'quotation_statuses';

  get_quotation_statuses() {
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/get_quotation_statuses`);
  }

  get_quotation_status(quotation_status_id: number) {
    return this.http.get<any>(
      environment.api_url + this.quotation_statuses_ep + `/get_quotation_status/${quotation_status_id}`
    );
  }

  get_quotations() {
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/get_quotations`);
  }

  get_quotations_user(user_id: number) {
    return this.http.get<any>(environment.api_url + this.quotations_ep + `/get_quotations_user/${user_id}`);
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
      environment.api_url + this.quotations_ep + `/update_quotation/${quotation_id}`,
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
      environment.api_url + this.quotations_ep + '/pending_quotes'
    );
  }

  //#endregion

  //#region Invoices

  invoices_ep = 'invoices';

  get_invoices() {
    return this.http.get<any>(environment.api_url + this.invoices_ep + `/get_invoices`);
  }

  update_invoice(invoice_id: number, invoice: any) {
    return this.http.put<any>(
      environment.api_url + this.invoices_ep + `/update_invoice/${invoice_id}`,
      invoice
    );
  }

  get_invoices_user(user_id: number) {
    return this.http.get<any>(environment.api_url + this.invoices_ep + `/get_invoices_user/${user_id}`);
  }

  get_invoice_by_quotation(quotation_id: number) {
    return this.http.get<any>(environment.api_url + this.invoices_ep + `/get_invoice_by_quotation/${quotation_id}`);
  }


  update_invoice_status(invoice_id: number) {
    return this.http.put<any>(
      environment.api_url + this.invoices_ep + `/update_invoice_status/${invoice_id}`,
      {}
    );
  }

  create_invoice(payload: any) {
    return this.http.post<any>(
      environment.api_url + this.invoices_ep + '/create_invoice',
      payload
    );
  }

  update_invoice_pop(invoice_id: number, pop_url: string) {
    return this.http.patch<any>(
      environment.api_url + this.invoices_ep + `/update_invoice_pop/${invoice_id}`,
      { pop: pop_url }
    );
  }

  get_invoice_by_job_card(job_card_id: number) {
    return this.http.get<any>(environment.api_url + this.invoices_ep + `/get_invoice_job_card/${job_card_id}`);
  }

  get_unpaid_invoices() {
    return this.http.get<any>(
      environment.api_url + this.invoices_ep + '/unpaid_invoices'
    );
  }

  // In your api.service.ts
  confirmPayFastPayment(invoiceId: number) {
    return this.http.post(
      environment.api_url +  this.invoices_ep +`/payfast-confirm/${invoiceId}`, {});
  }

  //#endregion

  //#region Receipts

  get_receipts_ep = 'receipts';

  get_receipts() {
    return this.http.get<any>(environment.api_url + this.get_receipts_ep + `/get_receipts`);
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


    get_revenue_data() {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_revenue_data`);
    }

    get_pending_job_requests(timeFilter: string) {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_pending_job_requests?filter=${timeFilter}`);
    }

    getJobCompletionTimeline() {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_job_completion_timeline`);
    }

    get_faqs() {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_faqs`);
    }

  getTitles() {
    return this.http.get<any>(environment.api_url + this.general_ep + `/get_titles`);
  }

  contactUs(contact: contact) {
    return this.http.post(environment.api_url + this.general_ep + '/contact_us', contact);
  }

    getAdminStats() {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_admin_stats`)
    }

    getArtisanStats(user_id:number) {
      return this.http.get<any>(environment.api_url + this.general_ep + `/get_artisan_stats/${user_id}`)
    }

    get_logout_timer(timer_id: number) {
      return this.http.get<any>(
        environment.api_url + this.general_ep + `/get_logout_timer/${timer_id}`
      );
    }

    update_logout_timer(timer_id: number, logout_timer: any) {
    return this.http.put<any>(
      environment.api_url +  this.general_ep + `/update_logout_timer/${timer_id}`,
      logout_timer
    );
  }

  //#endregion

  //#region Stock

  stock_ep = 'stock';

  get_stock_types() {
    return this.http.get<any>(environment.api_url + this.stock_ep + `/get_stock_types`);
  }

  get_stock_type(stock_type_id: number) {
    return this.http.get<any>(
      environment.api_url + this.stock_ep + `/get_stock_type/${stock_type_id}`
    );
  }


    get_stock_structure() {
      return this.http.get<any>(environment.api_url + this.stock_ep + `/get_stock_structure`);
    }

  createStockCategory(categoryName: string) {
    return this.http.post<any>(
      environment.api_url + this.stock_ep + '/create_stock_category',
      { category_name: categoryName }
    );
  }

  updateStockCategory(categoryId: number, categoryName: string) {
    return this.http.put<any>(
      environment.api_url + this.stock_ep + `/update_stock_category/${categoryId}`,
      { category_name: categoryName }
    );
  }

  deleteStockCategory(categoryId: number) {
    return this.http.delete<any>(
      environment.api_url + this.stock_ep + `/delete_stock_category/${categoryId}`
    );
  }

  // Stock Types
  createStockType(typeName: string, categoryId: number) {
    return this.http.post<any>(
      environment.api_url + this.stock_ep + '/create_stock_type',
      { type_name: typeName, stock_category_id: categoryId }
    );
  }

  updateStockType(typeId: number, typeName: string, categoryId: number) {
    return this.http.put<any>(
      environment.api_url + this.stock_ep + `/update_stock_type/${typeId}`,
      { type_name: typeName, stock_category_id: categoryId }
    );
  }

  deleteStockType(typeId: number) {
    return this.http.delete<any>(
      environment.api_url + this.stock_ep + `/delete_stock_type/${typeId}`
    );
  }

  // Move operations
  moveStockToType(stockId: number, newTypeId: number) {
    return this.http.post<any>(
      environment.api_url + this.stock_ep + `/move_stock/${stockId}`,
      { new_type_id: newTypeId }
    );
  }

  moveTypeToCategory(typeId: number, newCategoryId: number) {
    return this.http.post<any>(
      environment.api_url + this.stock_ep + `/move_type/${typeId}`,
      { new_category_id: newCategoryId }
    );
  }

  // Delete stock item
  deleteStock(stockId: number) {
    return this.http.delete<any>(
      environment.api_url + this.stock_ep + `/delete_stock/${stockId}`
    );
  }

    get_all_stock() {
      return this.http.get<any>(environment.api_url + this.stock_ep + `/get_all_stock`);
    }

  get_stock_categories() {
    return this.http.get<any>(environment.api_url + this.stock_ep + `/get_stock_categories`);
  }

  create_stock(stock: any) {
    return this.http.post<any>( environment.api_url + this.stock_ep + '/create_stock',
    stock
    );
  }

  update_stock(stock: any) {
    return this.http.put<any>(environment.api_url + this.stock_ep + `/update_stock/${stock.stock_id}`,
    stock
    );
  }

  export_stock_to_excel(): Observable<Blob> {
    return this.http.get(
      environment.api_url + this.stock_ep + `/export_stock_excel`,
      { responseType: 'blob' }
    ) as Observable<Blob>;
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
      environment.api_url + this.pattern_ep + `/delete_pattern/${pattern_id}`
    );
  }

  //#endregion

  //#region Material

  material_ep = 'material';

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
    ) as Observable<Blob>;
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

  get_delivery_notes() {
    return this.http.get<any>(environment.api_url + this.delivery_note_ep + `/get_delivery_notes`);
  }

  get_delivery_note(delivery_note_id: number) {
    return this.http.get<any>(
      environment.api_url + this.delivery_note_ep + `/get_delivery_note/${delivery_note_id}`
    );
  }

  create_delivery_note(delivery_note: any) {
    return this.http.post<any>(
      environment.api_url + this.delivery_note_ep + '/create_delivery_note',
      delivery_note
    );
  }

  delete_delivery_note(delivery_note_id: number) {
    return this.http.delete<any>(
      environment.api_url + this.delivery_note_ep + `/delete_delivery_note/${delivery_note_id}`
    );
  }

  get_delivery_notes_user(user_id: number) {
    return this.http.get<any>(environment.api_url + this.delivery_note_ep + `/get_devlivery_notes_user/${user_id}`);
  }

  //#endregion

  //#region employee time logs

  employee_time_logs_ep = 'employee_time_logs';

  get_monthly_hours_worked(year: number) {
    return this.http.get<any>(
      environment.api_url + this.employee_time_logs_ep + `/monthly_hours_worked?year=${year}`
    );
  }


  generateClockCode(type: 'clock_in' | 'clock_out', expiresIn: number = 5): Observable<{ code: number, expires_at: string }> {
    return this.http.post<{ code: number, expires_at: string }>(
      environment.api_url + this.employee_time_logs_ep + '/generate-clock-code',
      { type, expires_in: expiresIn }
    );
  }

  verifyClockCode(employeeId: number, code: number, type: 'clock_in' | 'clock_out'): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(
      environment.api_url + this.employee_time_logs_ep + '/verify-clock-code',
      { employee_id: employeeId, code, type }
    );
  }

  //#endregion
}
