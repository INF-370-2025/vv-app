import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { user } from '../models/user';
import { ApiService } from './api.service'; // Add ApiService
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userSubject = new BehaviorSubject<user | null>(null);
  isLoggedInSubject = new BehaviorSubject<boolean>(false);
  employeeSubject = new BehaviorSubject<any>(null); // Add employee subject

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private apiService: ApiService // Inject ApiService
  ) { }

  get isloggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  get user(): user | null {
    return this.userSubject.value;
  }

  get currentEmployee() {
    return this.employeeSubject.value;
  }

  // Add method to load employee profile
  loadEmployeeProfile(userId: number): void {
    this.apiService.get_profile_employee(userId).subscribe({
      next: (employee) => {
        this.employeeSubject.next(employee);
      },
      error: (err) => {
        this.notificationService.showError('Failed to load employee profile');
      }
    });
  }

  // Call this after successful login
  initializeUser(user: user): void {
    this.userSubject.next(user);
    this.isLoggedInSubject.next(true);

    // Load employee profile if user exists
    if (user && user.user_id) {
      this.loadEmployeeProfile(user.user_id);
    }
  }
}
