import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

@Injectable({
  providedIn: 'root'
})
export class PublicService implements OnDestroy {
  public redirectUrl: String = '';
  private subject = new Subject<any>();
  private subscriptions = [];

  subscribe(cb) {
    this.subscriptions.push(this.subject.asObservable().subscribe(cb));
  }

  setTitle(title: String) {
    this.subject.next(title);
  }

  ngOnDestroy() {
    for (let sb of this.subscriptions) {
      sb.unsubscribe();
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class CustomErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }

  formControl(required = true, maxLength: Boolean | Number = false, minLength: Boolean | Number = false) {
    let validators_ = [];
    if (required) {
      validators_.push(Validators.required);
    }
    if (maxLength !== false && typeof (maxLength) === 'number') {
      validators_.push(Validators.maxLength(Math.round(maxLength)));
    }
    if (minLength !== false && typeof (minLength) === 'number') {
      validators_.push(Validators.minLength(Math.round(minLength)));
    }
    return new FormControl('', validators_);
  }

}

export namespace Type {
  export class Point {
    x = 0;
    y = 0;
  }
  export enum FilterTypes {
    Normal = 0,
    Pure,
    UnMarked,
    Marked,
    Hided,
    All
  }
  export declare class ImageFilter {
    type?: FilterTypes;
    name?: String;
  }

  interface Map<T> {
    [n: number]: T;
  }
  export class Vector3 implements Map<number> {
    length = 0;
    constructor(v_) {
      for (let i in v_) {
        this[i] = v_[i];
      }
      this.length = v_.length;
    }
    [n: number]: number;
    set(v_) {
      for (let i in v_) {
        this[i] = v_[i];
      }
    }
    dot(v_) {
      if (v_.length !== 3) {
        console.error('Vector need 3 item');
        return 0;
      }
      return this[0] * v_[0] + this[1] * v_[1] + this[2] * v_[2];
    }
    toString() {
      return `vector: ${this[0]} ${this[1]} ${this[2]}`
    }
  }
  export class Matrix3 implements Map<Vector3> {
    length = 0;
    constructor(mm_) {
      for (let i in mm_) {
        this[i] = new Vector3(mm_[i]);
      }
      this.length = mm_.length;
    }
    [n: number]: Vector3;
    set?(mm_) {
      if (mm_.length === 3 && mm_[0].length === 3 && mm_[1].length === 3 && mm_[2].length === 3) {
        this[0].set(mm_[0]);
        this[1].set(mm_[1]);
        this[2].set(mm_[2]);
      } else {
        console.error('Matrix need 3x3 item');
      }
    }
    product?(vector: Vector3): Vector3 {
      let resV = [0, 0, 0];
      resV[0] = vector.dot(this[0]);
      resV[1] = vector.dot(this[1]);
      resV[2] = vector.dot(this[2]);
      return new Vector3(resV);
    }
    toString?() {
      return `${this[0][0]} ${this[0][1]} ${this[0][2]} \n${this[1][0]} ${this[1][1]} ${this[1][2]} \n${this[2][0]} ${this[2][1]} ${this[2][2]}`
    }
  }
}
