import { LoginComponent } from './auth/login/login.component';
import { Routes } from '@angular/router';
import { ProfileComponent } from './auth/profile/profile.component';
import { JobCardsComponent } from './components/job-cards/job-cards.component';
import { QuotationsComponent } from './components/quotations/quotations.component';
import { ReceiptsComponent } from './components/receipts/receipts.component';
import { EmployeeComponent } from './components/employee/employee.component';
import { JobRequestComponent } from './components/job-request/job-request.component';
import { RoleComponent } from './components/role/role.component';
import { UserComponent } from './components/user/user.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InvoicesComponent } from './components/invoices/invoices.component';
import { StockComponent } from './components/stock/stock.component';
import { PatternComponent } from './components/pattern/pattern.component';
import { DeliveryNoteComponent } from './components/delivery-note/delivery-note.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  { path: 'login', component:LoginComponent},
  { path: 'register', component:RegisterComponent},
  { path: 'home', component:DashboardComponent},
  { path: 'employee', component:EmployeeComponent},
  { path: 'role', component:RoleComponent},
  { path: 'user', component:UserComponent},
  { path: 'job-requests', component:JobRequestComponent},
  { path: 'job-cards', component:JobCardsComponent},
  { path: 'quotations', component:QuotationsComponent},
  { path: 'invoices', component:InvoicesComponent},
  { path: 'receipts', component:ReceiptsComponent},
  { path: 'profile', component:ProfileComponent},
  { path: 'stock', component:StockComponent},
  { path: 'pattern', component:PatternComponent},
  { path: 'delivery_note', component:DeliveryNoteComponent}


];
