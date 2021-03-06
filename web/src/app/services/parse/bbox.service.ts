import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Parse, ParseClass } from '../parse.service';

@Injectable({
  providedIn: 'root'
})
export class BBoxService extends ParseClass {
  public get bboxes() {
    return this.objects;
  }

  constructor(private router: Router) {
    super('BBox', router);
  }
}

export const BBox = Parse.Object.extend('BBox');
