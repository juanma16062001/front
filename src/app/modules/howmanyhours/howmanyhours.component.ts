import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Navigation as NavigationService } from '../../services/navigation';
import { Session } from '../../services/session';
import { MindsTitle } from '../../services/ux/title';
import { Client } from '../../services/api';
import { LoginReferrerService } from '../../services/login-referrer.service';

@Component({
  selector: 'm-howmanyhours',
  templateUrl: 'howmanyhours.component.html'
})

export class HowmanyhoursComponent {

  minds: Minds;
  hours: number;
  inProgress: boolean = true;

  constructor(
    public client: Client,
    public title: MindsTitle,
  ) {
    this.title.setTitle('HowManyHours');
    this.load();
  }

  ngOnInit() {
    this.minds = window.Minds;
  }

  /**
   * Loads boost settings from server
   */
  async load() {
    const response: any = await this.client.get(`api/v2/howmanyhours`);
    let registeredSecs = Math.floor(new Date().getTime() / 1000) - parseInt(response.seconds);
    this.hours = registeredSecs / 3600;
    this.inProgress = false;
  }

}
