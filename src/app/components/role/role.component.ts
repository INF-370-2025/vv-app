import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { role, roleClaim, roleClaimLine, insertRole, updateRole } from '../../models/role';
import { FormControl, FormGroup, Validators, FormArray, FormBuilder } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [AppModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.less'
})
export class RoleComponent implements OnInit {
  isloading: boolean = false;
  roles: role[] = [];
  staticRoles: role[] = [];
  users: any[] = [];
  showCreateRoleModal: boolean = false;
  showUpdateRoleModal: boolean = false;
  viewingRole = new role();
  role_claims: roleClaim[] = [];
  role_claim_lines: roleClaimLine[] = [];
  viewing_role_claim_lines: roleClaimLine[] = [];
  permissionForm: FormGroup;

  roleForm: FormGroup = new FormGroup({
    role_name: new FormControl(null, [Validators.required]),
    description: new FormControl(null)
  });

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private permissionService: PermissionService,
    private fb: FormBuilder
  ) {
    this.permissionForm = this.fb.group({
      permissions: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadRoles();
    this.loadUsers();
    this.loadRoleClaims();
    this.loadRoleClaimLines();
  }

  get permissionsArray(): FormArray {
    return this.permissionForm.get('permissions') as FormArray;
  }

  loadRoles(): void {
    this.isloading = true;
    this.apiService.get_roles().subscribe({
      next: (response) => {
        this.roles = [...response] as role[];
        this.staticRoles = this.roles;
        this.calculateUserCounts();
        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.notification.showError('Failed to load roles');
        this.isloading = false;
      }
    });
  }

  loadUsers(): void {
    this.apiService.get_users().subscribe({
      next: (response) => {
        this.users = response;
        this.calculateUserCounts();
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  loadRoleClaims(): void {
    this.apiService.get_role_claims().subscribe({
      next: (response) => {
        this.role_claims = [...response] as roleClaim[];
      },
      error: (err) => {
        console.error('Error loading role claims:', err);
      }
    });
  }

  loadRoleClaimLines(): void {
    this.apiService.get_role_claim_lines().subscribe({
      next: (response) => {
        this.role_claim_lines = [...response] as roleClaimLine[];
      },
      error: (err) => {
        console.error('Error loading role claim lines:', err);
      }
    });
  }

  calculateUserCounts(): void {
    if (this.roles.length && this.users.length) {
      this.roles.forEach(role => {
        role.user_count = this.users.filter(user => user.role_id === role.role_id).length;
      });
    }
  }

  searchRoles($event: any) {
    const searchTerm = $event.target.value.toLowerCase();
    if (searchTerm === "") {
      this.roles = this.staticRoles;
    } else {
      this.roles = this.staticRoles.filter(x =>
        (x.role_id && x.role_id.toString().includes(searchTerm)) ||
        (x.role_name && x.role_name.toLowerCase().includes(searchTerm)) ||
        (x.description && x.description.toLowerCase().includes(searchTerm))
      );
    }
  }

  canDeleteRole(roleId: number): boolean {
    // Protect Admin (role_id: 1) and Customer (role_id: 6) from deletion
    return roleId !== 1 && roleId !== 6;
  }

  viewCreateRole() {
    this.roleForm.reset();
    this.showCreateRoleModal = true;
  }

  createRole() {
    if (this.roleForm.valid) {
      this.isloading = true;
      const roleToInsert: insertRole = {
        role_name: this.roleForm.value.role_name,
        description: this.roleForm.value.description
      };

      this.apiService.create_role(roleToInsert).subscribe({
        next: (res) => {
          this.notification.showSuccess("Role successfully created");
          this.showCreateRoleModal = false;
          this.loadRoles();
        },
        error: (error) => {
          this.notification.showError("An error occurred while creating the role");
          this.isloading = false;
        }
      });
    } else {
      this.notification.showWarning("Please fill in all required fields");
    }
  }

  viewUpdateRole(role: role) {
    this.viewingRole = role;
    this.showUpdateRoleModal = true;

    // Initialize permission form
    this.permissionsArray.clear();

    this.role_claims.forEach(claim => {
      // Find existing permission for this role and claim
      const existingPermission = this.role_claim_lines.find(
        line => line.role_id === role.role_id && line.role_claim_id === claim.role_claim_id
      );

      this.permissionsArray.push(this.fb.group({
        role_claim_id: [claim.role_claim_id],
        permission: [claim.permission],
        view: [existingPermission ? existingPermission.view : false],
        create: [existingPermission ? existingPermission.create : false],
        update: [existingPermission ? existingPermission.update : false],
        delete: [existingPermission ? existingPermission.delete : false]
      }));
    });
  }

  updateRolePermissions() {
    this.isloading = true;
    let updateCount = 0;
    const totalUpdates = this.permissionsArray.length;

    if (totalUpdates === 0) {
      this.isloading = false;
      this.showUpdateRoleModal = false;
      return;
    }

    this.permissionsArray.controls.forEach(control => {
      const formValue = control.value;
      const roleClaimLine: roleClaimLine = {
        role_claim_id: formValue.role_claim_id,
        role_id: this.viewingRole.role_id,
        view: formValue.view,
        create: formValue.create,
        update: formValue.update,
        delete: formValue.delete
      };

      // Check if this permission already exists
      const existingPermission = this.role_claim_lines.find(
        line => line.role_id === this.viewingRole.role_id &&
               line.role_claim_id === formValue.role_claim_id
      );

      if (existingPermission) {
        // Update existing permission
        this.apiService.update_role_claim_line(
          formValue.role_claim_id,
          this.viewingRole.role_id,
          roleClaimLine
        ).subscribe({
          next: () => {
            updateCount++;
            if (updateCount === totalUpdates) {
              this.finalizeUpdate();
            }
          },
          error: (error) => {
            console.error('Error updating permission:', error);
            updateCount++;
            if (updateCount === totalUpdates) {
              this.finalizeUpdate();
            }
          }
        });
      } else {
        // Create new permission
        this.apiService.create_role_claim_line(roleClaimLine).subscribe({
          next: () => {
            updateCount++;
            if (updateCount === totalUpdates) {
              this.finalizeUpdate();
            }
          },
          error: (error) => {
            console.error('Error creating permission:', error);
            updateCount++;
            if (updateCount === totalUpdates) {
              this.finalizeUpdate();
            }
          }
        });
      }
    });
  }

  private finalizeUpdate() {
    this.notification.showSuccess("Role permissions updated successfully");
    this.isloading = false;
    this.showUpdateRoleModal = false;
    this.loadRoleClaimLines(); // Refresh permission data
  }

  deleteRole(role: role) {
    if (!this.canDeleteRole(role.role_id)) {
      this.notification.showWarning("This role cannot be deleted");
      return;
    }

    this.isloading = true;
    this.apiService.delete_role(role.role_id).subscribe({
      next: () => {
        this.notification.showSuccess("Role deleted successfully");
        this.loadRoles();
      },
      error: (error) => {
        this.notification.showError("Failed to delete role");
        this.isloading = false;
      }
    });
  }
}
