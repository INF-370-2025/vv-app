import { Component, ViewChild } from '@angular/core';
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
import { parseISO} from 'date-fns';
import { SupabaseService } from '../../../services/supabase.service';



@Component({
  selector: 'app-timesheet-calander',
  standalone: true,
  imports: [AppModule,FullCalendarModule],
  templateUrl: './timesheet-calander.component.html',
  styleUrl: './timesheet-calander.component.less'
})
export class TimesheetCalanderComponent {

  isloading:boolean = false;
  isQrloading:boolean = false;
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  calanderEvents: EventInput[] = [];
  calendarOptions=({
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
    weekends:true,
    events: [],
    nowIndicator: true,
    lazyFetching:true,
    editable: false,
    selectable: false,
    selectMirror: true,
    dayMaxEvents: true,
    allDaySlot: false,
    height:'auto',
    slotMinTime: '07:00:00',
    slotMaxTime: '16:00:00',
    eventColor: '#785CDF',
    eventClick: this.handleEventClick.bind(this),
  });
  clockCode:string = '';
  showCode:boolean = false;
  showExpired:boolean = false;

  constructor(private apiService: ApiService,private notification:NotificationService,private supabase:SupabaseService) {}
  
  ngOnInit() {
    this.loadTimeLogs();
  }

  loadTimeLogs() {
    this.isloading = true;
    this.apiService.get_time_logs().subscribe({
      next: res => {
        console.log(res);
        let events = res as employeTimeLog[];
          for(var i = 0 ; i < events.length;i++) {
          let log = events[i];
          let start = log.clock_in //parseISO(log.clock_in);
          let end = log.clock_out //parseISO(log.clock_out);
          let event  = {
            id:String(log.employee_time_log_id),
            title: String(log.employee?.user?.name.substring(0,1) + ' ' + log.employee?.user?.surname).toUpperCase(),
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
        this.notification.showError("An Error Occoured while processing your request");
        this.isloading = false;
      }
    });
  }

  generateColor(): string {
    const hues = [30, 60, 120, 180, 240, 270]; // Excluded 0 (Red)
    const hue = hues[Math.floor(Math.random() * hues.length)]; // Pick a nice hue
    const saturation = 80; // Keep colors rich
    const lightness = 30; // Keep it dark but not dull

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

  }

  async clockIn() {
    this.showCode = true;
    this.isQrloading = true;
    setTimeout(async () => {
      let todays_code = await this.supabase.get_todays_code();
      this.clockCode = todays_code?.code!;
      this.isQrloading = false;
    }, 1500);

  }

  clockOut() {
   this.showExpired = true;
  }



}
