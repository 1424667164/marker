import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Parse } from '../../services/parse.service';
import { PublicService, CustomErrorStateMatcher } from '../../services/public.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  private usernameFormControl = null;
  private passwordFormControl = null;
  // matcher = new MyErrorStateMatcher();

  private user = {
    name: '',
    password: ''
  };

  constructor(
    private router: Router,
    private publicService: PublicService,
    private matcher: CustomErrorStateMatcher) {
    this.usernameFormControl = matcher.formControl(true);
    this.passwordFormControl = matcher.formControl(true, 15, 6);
  }


  ngOnInit() {
    if (!!Parse.User.current()) {
      this.router.navigate([this.publicService.redirectUrl]);
    }
  }

  async signin() {
    try {
      let res = await Parse.User.logIn(this.user.name, this.user.password);
      console.dir(res);
      this.router.navigate([this.publicService.redirectUrl]);
    } catch (e) {
      console.error(e);
    }
  }

}
