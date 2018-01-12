import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Client } from '../../../../services/api/client';

@Component({
  moduleId: module.id,
  selector: 'm-wallet-token--rewards',
  templateUrl: 'rewards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class WalletTokenRewardsComponent {
  startDate: string;
  endDate: string;
  inProgress: boolean = false;
  rewards: any[] = [];
  offset: string;
  moreData: boolean = true;

  @Input() preview: boolean = false; // Preview mode

  constructor(protected client: Client, protected cd: ChangeDetectorRef) { }

  ngOnInit() {
    const d = new Date();

    d.setHours(23, 59, 59);
    this.endDate = d.toISOString();

    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0);
    this.startDate = d.toISOString();

    this.load(true);
  }

  async load(refresh: boolean) {
    if (this.inProgress && !refresh) {
      return;
    }

    if (refresh) {
      this.rewards = [];
      this.offset = '';
      this.moreData = true;
    }

    this.inProgress = true;

    this.detectChanges();

    try {
      let startDate = new Date(this.startDate),
        endDate = new Date(this.endDate);

      startDate.setHours(0, 0, 0);
      endDate.setHours(23, 59, 59);

      let response: any = await this.client.get(`api/v1/blockchain/rewards/ledger`, {
        from: Math.floor(+startDate / 1000),
        to: Math.floor(+endDate / 1000),
        offset: this.offset
      });

      if (refresh) {
        this.rewards = [];
      }

      if (response) {
        this.rewards.push(...(response.rewards || []));

        if (response['load-next']) {
          this.offset = response['load-next'];
        } else {
          this.moreData = false;
        }
      } else {
        console.error('No data');
        this.moreData = false;
        // TODO: Show
      }
    } catch (e) {
      console.error(e);
      this.moreData = false;
      // TODO: Show
    } finally {
      this.inProgress = false;
      this.detectChanges();
    }
  }

  onStartDateChange(newDate) {
    this.startDate = newDate;
    this.load(true);
  }

  onEndDateChange(newDate) {
    this.endDate = newDate;
    this.load(true);
  }

  detectChanges() {
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}