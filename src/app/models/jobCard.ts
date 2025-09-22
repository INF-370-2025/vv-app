import { stock } from './stock';
import { employee } from "./user";
import { invoice } from './invoice';
import { jobRequest } from './jobRequest';
import { quotationStatus } from './quotation';

export class jobCard{
    job_card_id!: number;
    created_at!: Date;
    special_instructions!:string;
    completed_at!: string | null;
    job_card_status_id!:number;
    job_card_status?:jobCardStatus;
    quotation_id?:number;
    quotation?:quotation;
    pattern_id?:number;
    pattern?:pattern;
    job_card_artisans?:jobCardArtisans[];
    job_card_material_items?:jobCardMaterialItem[];
    invoice?: invoice;
}

export class pattern{
  pattern_id!: number;
  pattern_type_id!: number;
  design!: string;
}

export class jobCardStatus{
  job_card_status_id!: number;
  status!: string;
}

export class jobCardArtisans {
  employee_id!: number;
  employee!: employee;
  job_card_id!: number;
}

export class jobCardMaterialItem{
  job_card_material_id!: number;
  job_card_id!: number;
  stock_id!: number;
  stock!: stock;
}

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



