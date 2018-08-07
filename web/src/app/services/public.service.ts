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
