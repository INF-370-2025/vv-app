export class role {
  role_id!: number;
  role_name!: string;
  description?: string;
  user_count?: number;
}

export class roleClaim {
  role_claim_id!: number;
  permission!: string;
}

export class roleClaimLine {
  role_claim_id!: number;
  role_claim?: roleClaim;
  role_id!: number;
  view: boolean = false;
  create: boolean = false;
  update: boolean = false;
  delete: boolean = false;
}

export class insertRole {
  role_name!: string;
  description?: string;
}

export class updateRole {
  role_name!: string;
  description?: string;
}
