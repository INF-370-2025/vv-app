import { Component } from '@angular/core';
import { AppModule } from '../../app.module';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [AppModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.less'
})
export class HelpComponent {
panels = [
  {
    name: 'Panel 1',
    active: true,
    disabled: false,
    type: 'video',
    videoId: 'dQw4w9WgXcQ' // YouTube ID for panel 1
  },
  {
    name: 'Panel 2',
    active: false,
    disabled: false,
    type: 'image',
    imageUrl: 'assets/example-image.jpg'
  },
  {
    name: 'Panel 3',
    active: false,
    disabled: false,
    type: 'text',
    text: 'This is some text content for panel 3'
  }
];


}

