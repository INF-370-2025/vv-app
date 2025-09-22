import { IconService } from './services/icon.service';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AppModule } from './app.module';
import { SupabaseService } from './services/supabase.service';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { ContactComponent } from './components/contact/contact.component';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NotificationService } from './services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { role } from './models/role';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppModule, RouterOutlet, CommonModule, RouterLink,RouterModule,ContactComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {

  isloading:boolean = true;

  // Menu
  menuCollapsed:boolean = false;
  menuCollapsedWidth = 54;
  menuUnCollapsedWidth = 230;


  // Modals
  contactModal:boolean= false;

  //Drawer
  visible = false;
  placement: NzDrawerPlacement = 'right';
  roles: any[] = [
    {"idx":0,"role_id":1,"created_at":"2025-05-01 08:00:00+00","role_name":"Admin"},
    {"idx":4,"role_id":5,"created_at":"2025-05-01 08:20:00+00","role_name":"Receptonist"},
    {"idx":5,"role_id":6,"created_at":"2025-05-21 08:09:37.88906+00","role_name":"Customer"},

  ];

  selectedRole: number = this.authService.user?.role_id || 1;
  showSearch = true;
  allowClear = true;
  dropdownMatchSelectWidth = true;

  jobRequests: any[] = [];

  lastViewedJobRequests = new Date(); // load from localStorage or backend
  lastViewedQuotations = new Date();
  lastViewedInvoices = new Date();

  newJobRequestsCount = 0;
  newQuotationsCount = 0;
  newInvoicesCount = 0;

  year: any = new Date().getFullYear();

  //Timer
    private logoutTimer: any;
    private destroy$ = new Subject<void>();

  constructor(private theme:ThemeService,public supabase:SupabaseService,private notification:NotificationService,private router:Router,
  private iconService:IconService,public authService:AuthService,private spinner: NgxSpinnerService,private apiService: ApiService) {
    this.supabase.connect_to_sb();
    this.subscribeToSupaAuth();

    this.authService.isloggedIn
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoggedIn => {
        isLoggedIn ? this.startLogoutTimer() : this.clearLogoutTimer();
      });
  }

  ngOnInit(): void {
    this.spinner.show();

    setTimeout(() => {
      this.spinner.hide();
      if(this.authService.isLoggedInSubject.value == false) {
        if(this.router.url == '/login' || this.router.url === '/register') {
          console.log("Welcome to VV")
          // this.startLogoutTimer();
        } else {
          this.router.navigateByUrl('/login');
        };
      } else {
        this.selectedRole = this.authService.user?.role_id || 1;
      }
    }, 1000);
    this.loadJobRequests();

  }


  loadJobRequests(): void {
    this.apiService.getJobRequests().subscribe({
      next: (res: any[]) => {
        this.jobRequests = res;

        // Get last visit timestamp from localStorage
        const lastVisit = localStorage.getItem('jobRequestsLastVisit') || '1970-01-01T00:00:00Z';
        const lastVisitDate = new Date(lastVisit);

        // Count new job requests
        this.newJobRequestsCount = this.jobRequests.filter(j => new Date(j.created_at) > lastVisitDate).length;
      },
      error: (err) => {
        console.error('Error loading job requests', err);
      }
    });
  }


  checkNewItems(jobRequests: any[], quotations: any[], invoices: any[]) {
    // Job Requests
    this.newJobRequestsCount = jobRequests.filter(
      jr => new Date(jr.created_at) > this.lastViewedJobRequests
    ).length;

    // Quotations
    this.newQuotationsCount = quotations.filter(
      q => new Date(q.created_at) > this.lastViewedQuotations
    ).length;

    // Invoices (only unpaid = 2)
    this.newInvoicesCount = invoices.filter(
      i => i.status === 2 && new Date(i.created_at) > this.lastViewedInvoices
    ).length;
  }

  markJobRequestsAsSeen() {
    this.lastViewedJobRequests = new Date();
    this.newJobRequestsCount = 0;
    // optionally save to localStorage or backend
  }

  markQuotationsAsSeen() {
    this.lastViewedQuotations = new Date();
    this.newQuotationsCount = 0;
  }

  markInvoicesAsSeen() {
    this.lastViewedInvoices = new Date();
    this.newInvoicesCount = 0;
  }


  //#region Auth

  async subscribeToSupaAuth() {

    const { data:listener } = this.supabase.client.auth.onAuthStateChange(async (event, session) => {

      if(event === 'SIGNED_IN' && session?.user) {
        this.supabase.set_user(session.user);
      }

      if(event === 'SIGNED_OUT') {
        console.log('signed-out')
      }

    });
    this.supabase.authSubscription = listener.subscription;
  }

  async sign_out() {
    await this.supabase.sign_out();
    sessionStorage.clear();
    localStorage.clear();
    await this.authService.isLoggedInSubject.next(false);
    await this.authService.userSubject.next(null);
    this.notification.showSuccess("Goodbye");
    this.router.navigateByUrl('/login');

    // this.clearLogoutTimer();
  }

  //#endregion

  //#region Extra

  openNotifications() {
    this.visible = !this.visible;
  }

  // async changeRole(role:number) {
  //   const response = await this.supabase.change_role(this.authService.user?.uuid!, role);
  //   if(!response) {
  //     this.notification.showError("Failed to Change Role, Please try again later");
  //   } else {
  //     window.location.reload();
  //   }
  // }

  async changeRole(roleId: number) {
    if (!this.authService.user?.uuid) {
      this.notification.showError("User not found");
      return;
    }

    this.spinner.show();
    try {
      const success = await this.supabase.change_role(this.authService.user.uuid, roleId);
      if (success) {
        this.notification.showSuccess(`Role changed to ${this.roles.find(r => r.role_id === roleId)?.role_name}`);
        // Instead of refreshUserData, reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        this.notification.showError("Failed to change role");
      }
    } catch (error) {
      this.notification.showError("Error changing role");
      console.error(error);
    } finally {
      this.spinner.hide();
    }
  }

  //#endregion

  ngOnDestroy(): void {
    if(this.supabase.authSubscription) { this.supabase.authSubscription.unsubscribe() };

    this.destroy$.next();
    this.destroy$.complete();
    this.clearLogoutTimer();
  }

  startLogoutTimer(): void {
    this.clearLogoutTimer();

    let timer = 30;

    // this.ApiService.get_logout_timer(1).subscribe({
    //     next: res => {
    //       timer = res.timer;
    //       console.log(timer);
    //     },
    //     error: (error) => {
    //       this.notification.showError("An Error Occoured while updating");
    //     }
    //   });
    this.logoutTimer = setTimeout(() => {
      this.sign_out();
      this.router.navigate(['/login']);
    }, 1800000); // 30 minutes
  }

  clearLogoutTimer(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  refreshRoles() {
    this.apiService.get_roles().subscribe({
      next: (response) => {
        this.roles = response;
      },
      error: (err) => {
        console.error('Error refreshing roles:', err);
      }
    });
  }
}
// import { IconService } from './services/icon.service';
// import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterOutlet, RouterLink, Router } from '@angular/router';
// import { ThemeService } from './services/theme.service';
// import { AppModule } from './app.module';
// import { SupabaseService } from './services/supabase.service';
// import { RouterModule } from '@angular/router';
// import { AuthService } from './services/auth.service';
// import { ContactComponent } from './components/contact/contact.component';
// import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
// import { NotificationService } from './services/notification.service';
// import { NgxSpinnerService } from 'ngx-spinner';
// import { role } from './models/role';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [AppModule, RouterOutlet, CommonModule, RouterLink,RouterModule,ContactComponent],
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.less'],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class AppComponent {

//   isloading:boolean = true;

//   // Menu
//   menuCollapsed:boolean = false;
//   menuCollapsedWidth = 54;
//   menuUnCollapsedWidth = 230;

//   // Modals
//   contactModal:boolean= false;

//   //Drawer
//   visible = false;
//   placement: NzDrawerPlacement = 'right';
//   roles: role[] = [
//     {"role_id":1, "role_name": "Admin"},
//     // {"role_id":2, "role_name": "Manager"},
//     // {"role_id":3, "role_name": "Accountant"},
//     // {"role_id":4, "role_name": "Receptionist"},
//     // {"role_id":5, "role_name": "Artisan"},
//     {"role_id":6, "role_name": "Customer"},
//   ];
//   setRole:number = 1;
//   year: any = new Date().getFullYear();

//   constructor(private theme:ThemeService,public supabase:SupabaseService,private notification:NotificationService,private router:Router,
//   private iconService:IconService,public authService:AuthService,private spinner: NgxSpinnerService) {
//     this.supabase.connect_to_sb();
//   }

//   ngOnInit(): void {
//     this.spinner.show();
//     setTimeout(() => {
//       this.spinner.hide();
//  //     if(this.authService.isLoggedInSubject.value == false) {
//         // if(this.router.url == '/login' || this.router.url === '/register') {
//         //   console.log("Welcome to VV")
//         // } else {
//         //   this.router.navigateByUrl('/login');
//         // };
//  //     } else {
//         //this.setRole = this.authService.user?.role?.role_id!;
// //      }
//       this.ignoreLogIn();
//     }, 1000);
//     //this.subscribeToSupaAuth();
//   }

//   async ignoreLogIn(){
//     await this.authService.isLoggedInSubject.next(true)
//     this.setRole = 1;

//   }
//   //#region Auth

//   async subscribeToSupaAuth() {

//     const { data:listener } = this.supabase.client.auth.onAuthStateChange((event, session) => {

//       if(event === 'SIGNED_IN' && session?.user) {
//          this.supabase.set_user(session.user);
//          this.setRole = this.authService.user?.role?.role_id!;
//       }

//       if(event === 'SIGNED_OUT') {
//         console.log('signed-out')
//       }

//     });
//     this.supabase.authSubscription = listener.subscription;
//   }

//   async sign_out() {
//     await this.supabase.sign_out();
//     sessionStorage.clear();
//     localStorage.clear();
//     await this.authService.isLoggedInSubject.next(false);
//     await this.authService.userSubject.next(null);
//     this.notification.showSuccess("Goodbye");
//     this.router.navigateByUrl('/login');
//   }

//   //#endregion

//   //#region Extra

//   openNotifications() {
//     this.visible = !this.visible;
//   }

//   async changeRole(role:number) {
//     const response = await this.supabase.change_role(this.authService.user?.uuid!, role);
//     if(!response) {
//       this.notification.showError("Failed to Change Role, Please try again later");
//     } else {
//       window.location.reload();
//     }
//   }

//   //#endregion

//   ngOnDestroy(): void {
//     if(this.supabase.authSubscription) { this.supabase.authSubscription.unsubscribe() };
//   }
// }
