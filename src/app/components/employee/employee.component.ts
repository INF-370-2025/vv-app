import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../app.module';
import { ApiService } from '../../services/api.service';
import { employee, employeeWarning } from '../../models/user';
import { GalleryItem, ImageItem } from 'ng-gallery';
import { count } from 'rxjs';


@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [AppModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.less'
})
export class EmployeeComponent implements OnInit{

  isloading:boolean = false;
  employees: employee[] = [];
  staticEmployees: employee[] = [];
  viewingEmployee:employee = new employee();
  showEmployeeModal:boolean = false;
  viewingImage: GalleryItem[] = [];
  employeeWarnings:employeeWarning[] = [];
  warningCount: number = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadEmployeeWarnings();
  }

  loadEmployees(): void {
      this.isloading = true;

      this.apiService.get_employees().subscribe({

        next: (response) => {
          this.employees = [...response] as employee[];
          this.staticEmployees = this.employees;
          console.log(this.employees);

          this.isloading = false;
        },
        error: (err) => {
          console.error('Error loading employees:', err);
          this.isloading = false;
        }
      });
  }

  loadEmployeeWarnings(): void {
    this.isloading = true;

    this.apiService.get_employee_warnings().subscribe({

      next: (response) => {
        this.employeeWarnings = [...response] as employeeWarning[];
        console.log(this.employeeWarnings);

        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading employee warnings:', err);
        this.isloading = false;
      }
    });
  }

  async viewEmployee(employee:employee) {
      this.viewingEmployee = employee;
      //await this.setViewingImage(employee.user?.image);
      this.warningCount = this.employeeWarnings.filter(warning => warning.employee_id === this.viewingEmployee.employee_id).length;
      this.showEmployeeModal = true;
  }

  searchEmployees($event:any) {
     if($event.target.value == "")
    {
      this.employees = this.staticEmployees;
    }
    else
    {
      // this.employees = this.employees.filter(x =>
      //   (x.unique_identifier && x.unique_identifier == $event.target.value) ||
      //   (x.user?.title?.title_name && x.user?.title?.title_name.toLowerCase().includes($event.target.value.toLowerCase())) ||
      //   (x.user?.name && x.user?.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
      //   (x.user?.surname && x.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
      //   (x.user?.role?.role_name && x.user?.role?.role_name.toLowerCase().includes($event.target.value.toLowerCase())) ||
      //   (x.user?.email_address && x.user?.email_address.toLowerCase().includes($event.target.value.toLowerCase())) ||
      //   (x.user?.phone_number && x.user?.phone_number.includes($event.target.value))
      // )
    }
  }

  // setViewingImage(images: employee[])
  //   {
  //     this.viewingImage = [];
  //     images.forEach(image => {
  //       this.viewingImage.push(new ImageItem({ src: image.user?.image, thumb: image.user?.image }));
  //     });
  // }

}
