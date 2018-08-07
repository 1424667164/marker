import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Parse } from '../../services/parse.service';
import { PublicService, CustomErrorStateMatcher } from '../../services/public.service';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
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
    private matcher: CustomErrorStateMatcher
  ) {
    this.usernameFormControl = matcher.formControl(true);
    this.passwordFormControl = matcher.formControl(true, 15, 6);
  }

  ngOnInit() {
  }

  async signup() {
    const that = this;
    const user = new Parse.User();
    user.set('username', this.user.name);
    user.set('password', this.user.password);
    try {
      let res = await user.signUp();
      console.dir(res);
      res = await Parse.User.logIn(that.user.name, that.user.password);
      console.dir(res);
      this.router.navigate([this.publicService.redirectUrl]);
    } catch (e) {
      console.error(e);
    }
  }
}
