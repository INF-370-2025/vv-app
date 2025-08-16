export class StockDetails {
    stock_id!: number;
    stock_details?:stock[];
}

export class stock {
  stock_id!: number;
  stock_type_id!: number;
  stock_type?: stock_type;
  material_id!: number;
  material?: material;
  name!: string;
  description!: string;
  stock_level!: number;
  stock_price!: number;
  created_at!: Date;
  stock_category: any;
}

export class material {
  material_id!: number;
  material_name!: string;
}

export class stock_type {
  stock_type_id!: number;
  type_name!: string;
}

export interface CreateStock {
  stock_id: 0;
  name: string;
  description: string;
  material_id: number;
  stock_type_id: number;
  stock_level: number;
  stock_price: number;
}

export class stock_category {
  stock_category_id!: number;
  category_name!: string;
}
