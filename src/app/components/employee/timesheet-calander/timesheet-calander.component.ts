import { Component, ViewChild, ChangeDetectorRef  } from '@angular/core';
import { AppModule } from '../../../app.module';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi, EventInput } from '@fullcalendar/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { employeTimeLog } from '../../../models/user';
import { parseISO } from 'date-fns';
import { AuthService } from '../../../services/auth.service'; // Import AuthService
import { interval, takeWhile } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-timesheet-calander',
  standalone: true,
  imports: [AppModule, FullCalendarModule],
  templateUrl: './timesheet-calander.component.html',
  styleUrl: './timesheet-calander.component.less',
    animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class TimesheetCalanderComponent {

  isloading: boolean = false;
  isGeneratingCode: boolean = false;
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  calanderEvents: EventInput[] = [];
  calendarOptions = {
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    timezone: 'auto',
    initialView: 'dayGridMonth',
    weekends: true,
    events: [],
    nowIndicator: true,
    lazyFetching: true,
    editable: false,
    selectable: false,
    selectMirror: true,
    dayMaxEvents: true,
    allDaySlot: false,
    height: 'auto',
    slotMinTime: '07:00:00',
    slotMaxTime: '16:00:00',
    eventColor: '#785CDF',
    eventClick: this.handleEventClick.bind(this),
  };

  // New properties for 4-digit code system
  currentEmployeeId: number | null = null;
  clockCode: string = '';
  showCodeModal: boolean = false;
  countdown: number = 300; // 5 minutes in seconds
  clockAction: 'clock_in' | 'clock_out' | null = null;
  countdownInterval: any;
  showCodeOverlay = false;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService, // Inject AuthService
    private cdr: ChangeDetectorRef
  ) {
    // Get current employee ID
    const currentUser = this.authService.user;
    if (this.authService.currentEmployee) {
      this.currentEmployeeId = this.authService.currentEmployee.employee_id;
    }
    this.authService.employeeSubject.subscribe(employee => {
      if (employee) {
        this.currentEmployeeId = employee.employee_id;
      }
    });

  }

  ngOnInit() {
    this.loadTimeLogs();
  }

  loadTimeLogs() {
    this.isloading = true;
    this.apiService.get_time_logs().subscribe({
      next: res => {
        let events = res as employeTimeLog[];
        for (var i = 0; i < events.length; i++) {
          let log = events[i];
          let start = log.clock_in;
          let end = log.clock_out;
          let event = {
            id: String(log.employee_time_log_id),
            title: String(log.employee?.user?.name.substring(0, 1) + ' ' + log.employee?.user?.surname).toUpperCase(),
            start: start,
            end: end,
            color: this.generateColor()
          }
          this.calanderEvents.push(event);
        }
        this.calendarComponent.events = this.calanderEvents;
        this.isloading = false;
      },
      error: (error) => {
        this.notification.showError("An error occurred while processing your request");
        this.isloading = false;
      }
    });
  }

  generateColor(): string {
    const hues = [30, 60, 120, 180, 240, 270];
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const saturation = 80;
    const lightness = 30;

    return this.hslToHex(hue, saturation, lightness);
  }

  hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  handleEventClick(clickInfo: EventClickArg) {
    // Handle event click if needed
  }

  generateClockInCode() {
    this.clockAction = 'clock_in';
    this.generateClockCode();
    console.log('clock', this.clockCode);
  }

  generateClockOutCode() {
    this.clockAction = 'clock_out';
    this.generateClockCode();
  }

  async generateClockCode() {
    if (!this.clockAction) return;

    this.isGeneratingCode = true;
    this.clockCode = ''; // Reset previous code

    try {
      const res = await this.apiService.generateClockCode(this.clockAction).toPromise();

      if (res && res.code) {
        // Format as 6-digit code with leading zeros
        this.clockCode = res.code.toString().padStart(6, '0');
        this.showCodeOverlay = true; // Show the overlay
        this.startCountdown();

        console.log('Generated Code:', this.clockCode,
                   'Type:', this.clockAction,
                   'Expires:', res.expires_at);
      } else {
        this.notification.showError('Received invalid response from server');
        console.error('Invalid response:', res);
      }
    } catch (error) {
      this.notification.showError('Failed to generate clock code');
      console.error('Error generating clock code:', error);
    } finally {
      this.isGeneratingCode = false;
    }
  }

  startCountdown() {
    // Clear any existing interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdown = 300; // Reset to 5 minutes

    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.closeOverlay();
      }
    }, 1000);
  }

  closeOverlay() {
    this.showCodeOverlay = false;
    this.clockCode = '';
    this.clockAction = null;

    // Clear interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }



  closeModal() {
    this.showCodeModal = false;
    this.clockCode = '';
    this.clockAction = null;

    // Clear interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.cdr.detectChanges();
  }


  get formattedCountdown(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

}
