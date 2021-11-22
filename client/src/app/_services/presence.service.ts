import { User } from './../_models/user';
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
    hubUrl = environment.hubUrl;
    private hubConnection: HubConnection;
    private onlineUsersSource = new BehaviorSubject<string[]>([]);
    onlineUsers$ = this.onlineUsersSource.asObservable();


  constructor(private toastr: ToastrService, private router: Router) { }

  createHubConnection(user : User){
      //building connection
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(this.hubUrl + 'presence', {
            accessTokenFactory : () => user.token
        })          // 'presence' name bcs must be same name used for hub
        .withAutomaticReconnect()
        .build()

    //starting the connection
    this.hubConnection
        .start()
        .catch(error => console.log(error));

    //listen if user is online/offline
    this.hubConnection.on('UserIsOnline', username => {
        this.onlineUsers$.pipe(take(1)).subscribe(usernames => {
            this.onlineUsersSource.next([...usernames, username])
        })
    })

    this.hubConnection.on('userIsOffline', username => {
        this.onlineUsers$.pipe(take(1)).subscribe(usernames => {
            this.onlineUsersSource.next([...usernames.filter(x => x !== username)])
    })
})

    this.hubConnection.on('GetOnlineUsers', (usernames: string[]) => {
        this.onlineUsersSource.next(usernames);
    })

    this.hubConnection.on('NewMessageReceived', ({username, knownAs}) => {
        this.toastr.info(knownAs + ' has sent you a new message!')
            .onTap
            .pipe(take(1))
            .subscribe(() => this.router.navigateByUrl('/members/' + username + '?tab=3'));
    })
  }

  //stopping the connection
  stopHubconnection(){
      this.hubConnection.stop().catch(error => console.log(error));
  }
}
