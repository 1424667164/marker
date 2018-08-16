import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Parse, ParseClass } from '../parse.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService extends ParseClass {
  public get images() {
    return this.objects;
  }

  constructor(private router: Router) {
    super('Image', router);
  }
}

export const Image = Parse.Object.extend('Image');
