import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Parse } from './services/parse.service';
import { PublicService } from './services/public.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  private title = '';
  private get hasTitle() {
    return this.title !== '';
  }
  constructor(
    private router: Router,
    private publicService: PublicService
  ) {
  }
  ngOnInit() {
    this.publicService.subscribe(title => {
      Promise.resolve().then(() => {
        this.title = title;
      });
    });
  }
  ngAfterViewInit() {
    this.setSize();
  }
  private get showToolbar() {
    return !!Parse.User.current();
  }
  async logout() {
    try {
      await Parse.User.logOut();
      this.router.navigate(['/user/signin']);
    } catch (e) {
      console.error(e);
    }
  }

  setSize() {
    let w = document.body.clientWidth;
    let h = document.body.clientHeight;
    if (w > 1024) {
      if (w / 2 > h) {
        w = 2 * h;
      } else {
        w = 1024;
      }
    }
    document.body.style.width = w + 'px';
  }
}
