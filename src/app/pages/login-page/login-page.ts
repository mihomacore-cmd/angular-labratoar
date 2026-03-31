import { Component } from '@angular/core';
import {AuthLayOut} from '../../layOut/auth_layOut/auth-lay-out';
import {LoginComponent} from '../../components/login/login';

@Component({
  selector: 'app-login-page',
 imports:[LoginComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {}
