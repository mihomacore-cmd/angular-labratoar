import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { LoginComponent } from '../../components/login/login';

@Component({
  selector: 'app-auth-lay-out',
  imports: [RouterOutlet,LoginComponent],
  templateUrl: './auth-lay-out.html',
  styleUrl: './auth-lay-out.scss',
})
export class AuthLayOut {}
