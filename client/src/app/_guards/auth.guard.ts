import { User } from './../_models/user';
import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { observable, Observable,of as observableOf } from 'rxjs';
import { AccountService } from '../_services/account.service';
import { map } from 'rxjs/operators';
import { isBoolean } from 'lodash';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private accountService: AccountService,private toastr : ToastrService){}

  canActivate(): Observable<boolean> {
    return this.accountService.currentUser$.pipe(
      map(user => {
        if(user) return true;
        else{
          this.toastr.error('You shall not pass!');
          return false;
        }
        
      })
    )
  }
  
}