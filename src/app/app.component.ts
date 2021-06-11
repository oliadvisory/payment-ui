import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import * as _ from 'lodash';
import * as moment from 'moment';

interface ITimers {
  checkoutId: string;
  startF: string;
  endF: string;
  start: number;
  end: number;
  addSecs: number;
  text: string;
}

interface ITimeCycle {
  // time right now
  now: number;
  // time to add to the clock (additional purchased time)
  addSeconds: number;
  // Last recorded wash end time (requires query from db)
  lastEnd: number;
  // start is the greater of the lastEnd or now
  start: number;
  // end equals the start + addSeconds
  end: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'payment-ui';

  public timers: ITimers[];

  constructor(private db: AngularFireDatabase) {
    this.getCheckoutIds();
    this.timers = [];
  }

  async getCheckoutIds() {
    const price = (
      await this.db.database.ref('time/price').once('value')
    ).val();

    // get ids
    const checkoutIds = _.keys(price);
    console.log(checkoutIds);

    // get last records for each
    const promiseArr = [];
    for (const i of checkoutIds) {
      promiseArr.push(this.getTimeCycles(i));
    }
    const lastCycles = await Promise.all(promiseArr);

    // normalize and calc times
    for (const i of lastCycles) {
      if (i.val) {
        const obj = _.toArray(i.val)[0];
        const startF = moment.unix(i.val.start).format('LT');
        const endF = moment.unix(i.val.end).format('LT');

        this.timers.push({
          checkoutId: i.id,
          start: i.val.start,
          end: i.val.end,
          startF: startF,
          endF: endF,
          addSecs: i.val.addSeconds,
          text: '',
        });
      }
    }

    let interval = 1000;
    setInterval(() => {
      const currentTime = Number(moment().format('X'));
      this.timers = _.map(this.timers, (val) => {
        const eventTime = val.end;
        let diffTime = eventTime - currentTime;
        let duration: any = moment.duration(diffTime * 1000, 'milliseconds');

        duration = moment.duration(duration - interval, 'milliseconds');
        const text = (val.text =
          // duration.hours() +
          // ':' +
          duration.minutes() + ':' + this.addZeroes(duration.seconds()));

        return val;
      }) as any;
    }, 1000);
  }

  async getTimeCycles(
    checkoutId: string
  ): Promise<{ val: ITimeCycle; id: string }> {
    return await this.db.database
      .ref(`time/cycle/${checkoutId}`)
      .orderByKey()
      .limitToLast(1)
      .once('value')
      .then((lastRecord) => {
        let l = lastRecord.val();
        if (l) {
          l = _.toArray(lastRecord.val())[0];
        }
        return {
          val: l,
          id: checkoutId,
        };
      });
  }

  addZeroes(dec: number) {
    dec = Math.abs(dec);
    if (!(dec.toString().length > 1)) {
      return '0' + dec;
    }
    return dec.toString();
  }
}
