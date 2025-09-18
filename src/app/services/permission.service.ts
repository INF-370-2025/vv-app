import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissions = new BehaviorSubject<any>({});
  currentPermissions = this.permissions.asObservable();

  updatePermissions(permissions: any) {
    this.permissions.next(permissions);
  }

  checkPermission(permission: string, action: string): boolean {
    const current = this.permissions.getValue();
    return current[permission] && current[permission][action];
  }
}
