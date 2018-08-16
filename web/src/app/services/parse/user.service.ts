import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Parse, ParseClass } from '../parse.service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends ParseClass {
  public get users() {
    return this.objects;
  }
  private adminSet = undefined;
  public get isAdmin() {
    if (this.adminSet === undefined) {
      this.checkAdmin();
    }
    return this.adminSet;
  }
  public get promiseAdmin() {
    return new Promise<boolean>(async (res, rej) => {
      if (this.adminSet === undefined) {
        this.adminSet = await this.checkAdmin();
      }
      res(this.adminSet);
    });
  }

async checkAdmin() {
  let query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'admin');
  let adminRole = await query.first();
  if (adminRole) {
    let users = adminRole.getUsers().query();
    let name = Parse.User.current().getUsername();
    let u = await users.contains('username', name).first();
    this.adminSet = !!u;
    return this.adminSet;
  }
  this.adminSet = false;
  return false;
}

constructor(private router: Router) {
  super('_User', router);
}
}

export const User = Parse.User;
