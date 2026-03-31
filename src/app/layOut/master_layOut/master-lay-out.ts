import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';

import { AddOrderComponent } from '../../components/addOrder/add-order.component';

@Component({
  selector: 'app-master-lay-out',
  imports: [
    RouterOutlet,
    RouterLinkWithHref
],
  templateUrl: './master-lay-out.html',
  styleUrl: './master-lay-out.scss',
})
export class MasterLayOut {


}
