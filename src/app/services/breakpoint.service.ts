import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

@Injectable({
  providedIn: 'root'
})
export class BreakpointService {

  breakPointSub!: Subscription;

  isScreenSmall:boolean = false;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakPointSub = this.breakpointObserver.observe([
      '(max-width: 599px)',
      '(min-width: 600px) and (max-width: 959px)',
      '(min-width: 960px)'
    ]).subscribe((state: BreakpointState) => {
      if (state.breakpoints['(max-width: 599px)'])
      {
        this.isScreenSmall = true;  // Small or extra small screens
      } else{
        this.isScreenSmall = false;  // Small or extra small screens
      }
    });
  }

  ngOnDestroy(): void {
    this.breakPointSub.unsubscribe();;
  }
}
