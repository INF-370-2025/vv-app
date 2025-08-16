import { jobCard } from "./jobCard";

export class invoice{
    invoice_id!: number;
    created_at!: Date;
    job_card_id!: number;
    job_card?:jobCard;
    total!: number;
    invoice_status_id!:number;
    invoice_status?:invoiceStatus;
    invoice_url!:string;
    invoice_number!:string;
    pop!: string;
}

export class invoiceStatus{
    invoice_status_id!:number;
    status!:string;
}


export class upsertInvoice{
    invoice_id!: number;
    job_card_id!: number;
    total!: number;
    invoice_url!:string;
    invoice_number!:string;
    invoice_status_id!:number;
}
