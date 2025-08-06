import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { role, roleClaim, roleClaimLine } from '../../models/role';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { NzSwitchModule } from 'ng-zorro-antd/switch';


@Component({
  selector: 'app-role',
  standalone: true,
  imports: [AppModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.less'
})
export class RoleComponent implements OnInit{

isloading:boolean = false;
roles:role[] = [];
staticRoles:role[] = [];
showCreateRoleModal:boolean = false;
showUpdateRoleModal:boolean = false;
viewingRole = new role();
role_claims:roleClaim[] = [];
role_claim_lines:roleClaimLine[] = [];
viewing_role_claim_lines:roleClaimLine[] = [];
i:number = 0;
j:number = 0;



roleForm:FormGroup = new FormGroup({
      role_name: new FormControl(null, [Validators.required]),
    });

  constructor(private apiService: ApiService, private notification:NotificationService) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles(): void {

    this.isloading = true;

    this.apiService.get_roles().subscribe({
    
          next: (response) => {
            this.roles = [...response] as role[];
            this.staticRoles = this.roles;
            console.log(this.roles);
    
            this.isloading = false;
          },
          error: (err) => {
            console.error('Error loading users:', err);
            this.isloading = false;
          }
        });
  }

  searchRoles($event:any) {
     if($event.target.value == "")
    {
      this.roles = this.staticRoles;
    }
    else
    {
      this.roles = this.roles.filter(x =>
        (x.role_id && x.role_id == $event.target.value) ||
        (x.role_name && x.role_name.toLowerCase().includes($event.target.value.toLowerCase()))
      )
    }
  }

  async viewCreateRole() {
      this.showCreateRoleModal = true;
  }

  async createRole() {
    let roleToInsert = new role();
        roleToInsert.role_name = this.roleForm.value.role_name;

        this.apiService.create_role(roleToInsert).subscribe({
        next: res => {
          this.notification.showSuccess("Role successfully created");
          this.isloading = false;
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while processing your creation");
          this.isloading = false;
        }
      });
        
        console.log(roleToInsert);
  }

  async viewUpdateRole(role:role) {
      this.showUpdateRoleModal = true;
      this.viewingRole = role;

      this.apiService.get_role_claims().subscribe({
    
          next: (response) => {
            this.role_claims = [...response] as roleClaim[];
            console.log(this.role_claims);
    
            this.isloading = false;
          },
          error: (err) => {
            console.error('Error loading users:', err);
            this.isloading = false;
          }
        });

      this.apiService.get_role_claim_lines().subscribe({

        next: (response) => {
          this.role_claim_lines = [...response] as roleClaimLine[];
          console.log(this.role_claim_lines);

          this.isloading = false;
        },
        error: (err) => {
          console.error('Error loading users:', err);
          this.isloading = false;
        }
      });

      this.i = 0;
      this.viewing_role_claim_lines = [];
      while(this.i < this.role_claim_lines.length){
        if(this.role_claim_lines[this.i].role_id === this.viewingRole.role_id){
          this.viewing_role_claim_lines.push(this.role_claim_lines[this.i]);
          this.i++;
        }else{
          this.i++;
        }
      }

      this.viewing_role_claim_lines.sort((a, b) => a.role_claim_id - b.role_claim_id);

      console.log(this.viewing_role_claim_lines);

  }
  
  async updateRole(){

  }
}