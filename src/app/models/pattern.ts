export class pattern {
  pattern_id?: number;
  pattern_type_id!: number;
  design!: string;
  created_at?: string;
  pattern_type?: pattern_type;
}

export class pattern_type {
  pattern_type_id!: number;
  type_name!: string;
  created_at?: string;
}
