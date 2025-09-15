import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private notification: NzNotificationService) { }

  public showError(message: string, title? : string): void {
    title = title == undefined ? 'Error' : title;
    this.notification.error(title, message);
  }

  public showSuccess(message: string, title? : string): void {
    title = title == undefined ? 'Success' : title;
    this.notification.success(title, message);
  }

  public showWarning(message: string, title? : string): void {
    title = title == undefined ? 'Warning' : title;
    this.notification.warning(title, message);
  }

  public showInfo(message: string, title? : string): void {
    title = title == undefined ? 'Info' : title;
    this.notification.info(title, message);
  }
}