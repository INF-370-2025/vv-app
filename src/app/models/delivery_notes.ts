
export class delivery_note{
  delivery_note_id!: number;
  delivery_note_status_id!: number;
  job_card_id!: number
  delivery_note_url!: string;
  created_at!: string;

}

export class invoiceStatus{
    delivery_note_status_id!:number;
    status!:string;
}
