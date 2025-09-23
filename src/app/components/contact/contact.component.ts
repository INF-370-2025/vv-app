import { Component } from '@angular/core';
import { AppComponent } from '../../app.component';
import { AppModule } from '../../app.module';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { contact, email } from '../../models/general';
import { employee } from '../../models/user';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [AppModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.less'
})
export class ContactComponent {

  isLoading:boolean = false;

  Form = new FormGroup({
    reason: new FormControl('Bug on System', [Validators.required]),
    subject: new FormControl(null, [Validators.required]),
    message: new FormControl(null, [Validators.required])
  });

  constructor(private notification:NotificationService,private apiService:ApiService, private authService:AuthService) { }

  ngOnInit():void {

  }

  onContact()
  {
    if (!this.Form.valid)
    {
      Object.values(this.Form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
    else
    {
      this.isLoading = true;
      let message = new contact();
      message.subject = String(this.Form.controls['subject'].value);
      message.message = String(this.Form.controls['message'].value);
      message.user_id = this.authService.user?.user_id!;

      let newEmail = new email();
      newEmail.to_email = this.authService.user!.email_address;
    newEmail.subject = String(this.Form.controls['subject'].value);
    newEmail.body = String(this.Form.controls['message'].value);

    this.apiService.send_email(newEmail).subscribe({
      next: (res) => {
        this.notification.showSuccess('Success', 'Email sent successfully');
        window.location.href = 'http://localhost:4200/home';
      },
      error: (err) => {
        this.notification.showError('Error', 'Failed to send email');
        console.log(newEmail);
      }
    });
    }
  }

}
