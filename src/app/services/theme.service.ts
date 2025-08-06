import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  currentTheme: string = 'main';
  constructor() { this.loadTheme() }

  loadTheme(): any {
    const theme = this.currentTheme;
    this.loadCss(`${theme}.css`, theme).then(
      e => {
            document.documentElement.classList.add(theme);
         });
  }

  private loadCss(href: string, id: string): Promise<Event> {
    return new Promise((resolve, reject) => {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = href;
      style.id = id;
      style.onload = resolve;
      style.onerror = reject;
      document.head.append(style);
    });
  }

}