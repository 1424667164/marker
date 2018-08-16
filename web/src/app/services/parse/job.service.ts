import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Parse, ParseClass } from '../parse.service';

@Injectable({
  providedIn: 'root'
})
export class JobService extends ParseClass {
  public get jobs() {
    return this.objects;
  }

  constructor(private router: Router) {
    super('Job', router);
  }
}

export const Job = Parse.Object.extend('Job');
