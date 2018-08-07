import { Injectable } from '@angular/core';
import {
  CanActivate, Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Parse } from '../services/parse.service';
import { PublicService } from '../services/public.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuardService implements CanActivate {
  constructor(private publicService: PublicService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkLogin(state.url);
  }
  checkLogin(url: string): boolean {
    if (!!Parse.User.current()) { return true; }

    // Store the attempted URL for redirecting
    this.publicService.redirectUrl = url;

    // Navigate to the login page with extras
    this.router.navigate(['/user/signin']);
    return false;
  }
}
