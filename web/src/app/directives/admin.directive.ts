import { Directive } from '@angular/core';
import { NG_ASYNC_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from '../services/parse/user.service';

@Directive({
  selector: '[checkAdmin]',
  providers: [{ provide: NG_ASYNC_VALIDATORS, useExisting: AdminDirective, multi: true }]
})
export class AdminDirective {
  constructor(private userService: UserService) { }
  async validate(control: AbstractControl): Promise<ValidationErrors | null> {
    return new Promise<ValidationErrors | null>((res_, rej) => {
      this.userService.checkAdmin()
      .then(res => {
        res_(res ? null : {'notAdmin': true});
      })
      .catch(() => {
        console.log(1);
        res_({'notAdmin': true});
      });
    });
  }
}
