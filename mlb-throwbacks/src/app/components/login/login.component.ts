import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HomeComponent } from "../../home/home.component";
@Component({
  selector: 'app-login',
  standalone: true,
  
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private authService: AuthService, private router:Router) {}

  login() {
    this.authService.googleLogin().then(() => {
      console.log('User logged in');
      this.router.navigate(['/home'])

    });
  }

}
