import { Injectable } from '@angular/core';
import { AuthError, AuthUser, createClient, Subscription, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { user } from '../models/user';
import { AuthService } from './auth.service';
import { roleClaim, roleClaimLine } from '../models/role';
import { timeLogCode } from '../models/general';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase!: SupabaseClient;
  public authSubscription!:Subscription;
  setRole:number = 1;

  constructor(private router:Router,private notification:NotificationService,private auth:AuthService) {}

  async connect_to_sb() {
    this.supabase = createClient(environment.supa_url, environment.supa_key);
  }

  async initialize_auth() {
    const session = await this.supabase.auth.getSession();
    if(session) {
      this.set_user(session.data.session?.user!);
    }
  }

  get client() {
    return this.supabase;
  }

  async sign_in(channel:boolean,phone:string = "", email:string  ="") {
    if(channel) {
      const { data, error } = await this.supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: false
        }
      });

      if(error) {
        const err = error as AuthError;
        console.log("Failed to Authenticate User: ", err.message);
        return null;
      }

      return data;
    }
    else
    {

      const { data, error } = await this.supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false
        }
      });

      if(error) {
        const err = error as AuthError;
        console.log("Failed to Authenticate User: ", err.message);
        return null;
      }

      return data;
    }

  }

  async verify_user(channel:boolean,otp:string,value:string) {

    if(channel) {
      const { data, error } = await this.supabase.auth.verifyOtp({
        phone: value,
        token: otp,
        type: 'sms'
      });

      if(error) {
        const err = error as AuthError;
        console.log("Failed to Authenticate User: ", err.message);
        return null;
      }

      return data;

   } else {

      const { data, error } = await this.supabase.auth.verifyOtp({
        email: value,
        token: otp,
        type: 'email'
      });

      if(error) {
        const err = error as AuthError;
        console.log("Failed to Authenticate User: ", err.message);
        return null;
      }

      return data;
   }
  }

  async set_user(auth:User) {
    if(auth) {
      let user = await this.get_user(auth.id);
      if(!user) {
        this.notification.showError("Failed to load your Profile, Please contact support");
      } else {
       await this.auth.isLoggedInSubject.next(true);
       await this.auth.userSubject.next(user);
       user.claims = await this.load_claims(user.role_id)! || [] ;
       this.setRole = user?.role_id!;
       // console.log(user);
       return true;
      }
    }
    return false;
  }

  async get_session() {

  }

  async get_user(user_id:string) {
    try{
      const { data, error } = await this.supabase.schema(environment.schema).from('user').select('*,role:role_id(*)').eq('uuid',user_id).single();

      if(error || !data || data.length === 0) {
        if(error) {
          console.log(error);
        }
        return null;
      }

      return data as user;

    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async load_claims(role_id:number) {
     try{
      const { data, error } = await this.supabase.schema(environment.schema).from('role_claim_line').select('role_claim_id,role_claim:role_claim_id(permission),role_id,view,create,update,delete').eq('role_id',role_id);

      if(error || !data || data.length === 0) {
        if(error) {
          console.log(error);
        }
        return null;
      }

      return data as unknown as roleClaimLine[];

    } catch(error) {
      console.log(error);
      return null;
    }

  }

  async change_role(user_id:string,role_id:number) {
    try{
      const { data, error } = await this.supabase.schema(environment.schema).from('user').update({'role_id':role_id}).eq('uuid',user_id).select();

      if(error) {
        console.log(error);
        return null;
      }

      this.setRole = role_id;
      return data;

    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async sign_out() {
   const { error } = await this.supabase.auth.signOut();
   if(error) {
    console.log(error);
    this.notification.showError(String(error));
   }
  }

  async get_customer_id(user_id:number) {
    try{
      const { data, error } = await this.supabase.schema(environment.schema).from('customers').select('customer_id').eq('user_id',user_id).single();

      if(error || !data) {
        if(error) {
          console.log(error);
        }
        return null;
      }

      return data.customer_id	 as unknown as number;

    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async uploadFileToStorage(file: NzUploadFile, container: string): Promise<string> {
    const fileToUpload: File = file.originFileObj || new File([file as any], file.name, { type: file.type || 'application/octet-stream' });

    if (!fileToUpload) {
      console.error("File is missing or invalid:", file);
      throw new Error("Invalid file or file missing.");
    }

    const extension = file.name.split(".").pop() ?? "";
    const fileName = `${new Date().getTime()}.${extension}`;

    // Upload the file
    const { data: privateData, error: privateError } = await this.supabase.storage.from(container).upload(fileName, fileToUpload);

    if (privateError) {
      console.error("Upload error:", privateError.message);
      throw privateError;
    }

    // Get the public URL
    const { publicUrl } = this.supabase.storage.from(container).getPublicUrl(fileName).data;

    return publicUrl;
  }

  async save_job_request_item(job_request_id:number,item_url:string) {
    try{
      const { data, error } = await this.supabase.schema(environment.schema).from('job_request_item').insert({'job_request_id':job_request_id,'item_url':item_url});

      if(error) {
        console.log(error);
        return null;
      }

      return data;

    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async update_profile_pic(user_id:number,url:string) {
      try{
        const { data, error } = await this.supabase.schema(environment.schema).from('user').update({'image':url}).eq('user_id',user_id);

        if(error) {
          console.log(error);
          return null;
        }

        return data;

      } catch(error) {
        console.log(error);
        return null;
      }
  }

  async get_todays_code() {
      try{
        const { data, error } = await this.supabase.schema(environment.schema).from('time_log_codes').select('*').single();

        if(error || !data) {
          if(error) {
            console.log(error);
          }
          return null;
        }

        return data as timeLogCode

      } catch(error) {
        console.log(error);
        return null;
      }
  }
 



}
