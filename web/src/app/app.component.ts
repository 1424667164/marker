import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Parse } from './services/parse.service';
import { PublicService } from './services/public.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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
      // setTimeout((() => {
      //   this.title = title;
      // }).bind(this), 10);
    });
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
}
