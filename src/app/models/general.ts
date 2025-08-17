export class contact{
    subject!: string;
    message!: string;
    user_id!:number;
}

export class adminStats {
    new_requests!:number
    completed_job_cards_week!:number
    total_customers!:number
    employees_clocked_in_today!:number
}

export class artisanStats {
    jobs_completed!:number
    hours_worked!:number
    accumulated_pay!:number
}

export class timeLogCode {
    id!:number
    created_at!:Date
    code!:string
}

export class email {
    to_email!:string
    subject!:string
    body!:string
}

export class logout_timer {
    time!:number
}