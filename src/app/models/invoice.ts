// In invoice.ts
import { jobCard } from './jobCard';

export class invoice {
    invoice_id!: number;
    created_at!: Date;
    invoice_created_at!: Date; // Add this
    job_card_id!: number;
    quote_id?: number; // Add this
    job_card?: jobCard;
    total!: number;
    invoice_status_id!: number;
    invoice_status?: invoiceStatus;
    invoice_url!: string;
    invoice_number!: string;
    pop!: string;

    // Add these properties for the new view structure
    direct_customer?: {
        customer_id: number;
        company_name: string;
        address: string;
        registration_number: string;
        vat_number: string;
        customer_type?: {
            customer_type_id: number;
            type_name: string;
        };
        user?: {
            user_id: number;
            name: string;
            surname: string;
            email_address: string;
            phone_number: string;
            image: string;
        };
    };
}

export class invoiceStatus {
    invoice_status_id!: number;
    status!: string;
}

export class upsertInvoice {
    invoice_id!: number;
    job_card_id!: number;
    quote_id?: number; // Add this
    total!: number;
    invoice_url!: string;
    invoice_number!: string;
    invoice_status_id!: number;
}
