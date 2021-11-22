import { User} from './../_models/user';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {map} from 'rxjs/operators'
import { ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PresenceService } from './presence.service';


@Injectable({
  providedIn: 'root'
})
export class AccountService {
  baseUrl = environment.apiUrl;
  private currentUserSource = new ReplaySubject<User>(1);
  currentUser$ = this.currentUserSource.asObservable();
  

  constructor(private http: HttpClient, private presence: PresenceService) { }

  login(model: any){
    return this.http.post<User>(this.baseUrl + 'account/login', model).pipe(
      map((response: User) => {
        const user = response;
        if(user){
          this.setCurrentUser(user);  //setting are configured in setCurrentUser method for local storage and currentUserSource
          this.presence.createHubConnection(user);   //connecting to hub
        }
      })
    )     
  }

  register(model: any){
    return this.http.post<User>(this.baseUrl + 'account/register', model).pipe(
      map((user : User) => {
        if(user){
          this.setCurrentUser(user);
          this.presence.createHubConnection(user);
        }
      })
    )
  }

  setCurrentUser(user : User){
    user.roles = [];
    const roles = this.getDecodedToken(user.token).role;  //getting the roles from token
    Array.isArray(roles) ? user.roles = roles : user.roles.push(roles); 
    localStorage.setItem('user',JSON.stringify(user));
    this.currentUserSource.next(user);
  }

  logout(){
    localStorage.removeItem('user');    
    this.currentUserSource.next(null!);
    this.presence.stopHubconnection();
  }

  getDecodedToken(token: string){
      return JSON.parse(atob(token.split('.')[1]));   //getting only the payload from token
  }
}
