import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MasterLayOut} from '../../layOut/master_layOut/master-lay-out';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterOutlet,
    MasterLayOut
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  standalone: true,

})
export class DashboardPage {

}
