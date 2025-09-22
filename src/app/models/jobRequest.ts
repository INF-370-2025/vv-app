import { customer } from "./user";

export class jobRequest{
    job_request_id!: number;
    created_at!: string;
    customer_id?:number;
    customer?:customer;
    title?:string;
    description?:string;
    finish_date!:Date;
    quantity!:number;
    job_request_status?:jobRequestStatus;
    job_request_items?:jobRequestItem[];
    job_request_status_id?: number;
    progress_url?:string;

}


export class jobRequestItem{
    job_request_item_id!: number;
    created_at!: Date;
    job_request_id!: number;
    item_url!:string;
}


export class jobRequestStatus{
    job_request_status_id!: number;
    status!:string;
}

export class insertJobRequest{
    customer_id?:number;
    title?:string;
    description?:string;
    finish_date!:Date;
    quantity!:number;
}

export class invoice {
  invoice_id!: number;
  job_card_id?: number;
  total?: number;
  invoice_status_id?: number;
  invoice_url?: string;
  invoice_number?: string;
}
