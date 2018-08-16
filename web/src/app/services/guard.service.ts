import { Injectable } from '@angular/core';
import {
  CanActivate, CanActivateChild, Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Resolve
} from '@angular/router';
import { Parse } from './parse.service';
import { ProjectService } from './parse/project.service';
import { JobService } from './parse/job.service';
import { UserService } from './parse/user.service';
import { PublicService } from './public.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuardService implements CanActivate, CanActivateChild {
  constructor(private publicService: PublicService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkLogin(state.url);
  }
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
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

@Injectable({
  providedIn: 'root'
})
export class adminGuardService implements CanActivate, CanActivateChild {
  constructor(private userService: UserService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.checkAdmin(route.data);
  }
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.canActivate(route, state);
  }
  checkAdmin(data: any): Promise<boolean> {
    return this.userService.promiseAdmin;
  }
}

@Injectable()
export class ProjectResolver implements Resolve<any> {
  constructor(private projectServices: ProjectService, private router: Router) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    let id = route.parent.paramMap.get('id');
    return new Promise((res, rej) => {
      for (let ws in this.projectServices.projects) {
        if (this.projectServices.projects[ws][id]) {
          res(this.projectServices.projects[ws][id]);
          return;
        }
      }
      this.projectServices.subscribe({}, (projects) => {
        projects[id] && res(projects[id]);
      });
      this.projectServices.reload();
    });
  }
}

@Injectable()
export class JobResolver implements Resolve<any> {
  constructor(private jobService: JobService, private router: Router) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    let id = route.parent.paramMap.get('id');
    return new Promise((res, rej) => {
      for (let ws in this.jobService.jobs) {
        if (this.jobService.jobs[ws][id]) {
          res(this.jobService.jobs[ws][id]);
          return;
        }
      }
      let query = new Parse.Query('Job');
      query.get(id).then(job => {
        res(job);
      }).catch(err => { console.dir(err) });
    });
  }
}


@Injectable()
export class AdminResolver implements Resolve<any> {
  constructor(private userService: UserService, private router: Router) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    var resed = false;
    var isAdmin_ = false;
    return new Promise((res, rej) => {
      if (!resed) {
        this.userService.checkAdmin().then(isAdmin => {
          isAdmin_ = isAdmin;
          resed = true;
          res(isAdmin);
        });
      } else {
        res(isAdmin_);
      }
    });
  }
}
