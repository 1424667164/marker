import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Parse, ParseClass } from '../parse.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService extends ParseClass {
  public get projects() {
    return this.objects;
  }

  constructor(private router: Router) {
    super('Project', router);
  }
}

export const Project = Parse.Object.extend('Project');
