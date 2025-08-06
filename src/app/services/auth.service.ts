import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { user } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userSubject = new BehaviorSubject<user | null>(null);
  isLoggedInSubject = new BehaviorSubject<boolean>(false);

  constructor(private router:Router,private notificationService:NotificationService) { }

  get isloggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  get user(): user | null {
    return this.userSubject.value;
  }



  


}
