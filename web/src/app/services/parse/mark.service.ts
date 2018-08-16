import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Parse, ParseClass } from '../parse.service';

@Injectable({
  providedIn: 'root'
})
export class MarkService extends ParseClass {
  public get marks() {
    return this.objects;
  }

  constructor(private router: Router) {
    super('Mark', router);
  }
}

export const Mark = Parse.Object.extend('Mark');
