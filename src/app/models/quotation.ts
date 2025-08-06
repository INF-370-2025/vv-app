import { jobRequest } from "./jobRequest";

export class quotation{
    quotation_id!: number;
    created_at!: Date;
    job_request_id!: number;
    job_request?:jobRequest;
    projected_costs!: number;
    deposit!: number;
    total_cost!: number;
    quotation_status_id!:number;
    quotation_status?:quotationStatus;
    quotation_url!:string;
    quotation_number!:string;
}

export class quotationStatus{
    quotation_status_id!:number;
    status!:string;
}


export class upsertQuotation{
    quotation_id!: number;
    job_request_id!: number;
    deposit!: number;
    total_cost!: number;
    quotation_url!:string;
    quotation_number!:string;
}


