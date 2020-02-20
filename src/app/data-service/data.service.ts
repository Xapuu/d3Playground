import { Injectable, OnDestroy } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataService implements OnDestroy {

  constructor() { }

  isAlive$ = new Subject();

  ngOnDestroy() { this.isAlive$.next(); }

  incrementDecrement() {
    return !!Math.round(Math.random());
  }


  getLiveData(startValue) {
    const start = startValue;

    console.log('start', start);
    let mockTimePass = 0;


    return interval(1000)
      .pipe(
        takeUntil(this.isAlive$),
        map(x => {
          const d = new Date();
          d.setDate(d.getDate() + mockTimePass);
          mockTimePass++;

          return start.map((_, i) => {
            start[i] = this.incrementDecrement() ? start[i] -= 10 : start[i] += 1;
            return {
              id: i,
              mean: start[i] < 0 ? 0 : start[i],
              time: d
            };
          });
        }
        )
      );
  }


  getDataArray(n): {
    field: string;
    source: {
      mean: number;
      time: Date;
    }[];
    device_id: string;
    subsystem_id: string;
    controller_instance: number;
  }[] {
    const result = [];

    let start = 250;

    for (let i = 0; i < n; i++) {

      result.push(
        {
          field: 'gosho' + i,
          source: (new Array(100)).fill(null).map((x, i) => {

            const d = new Date();
            d.setDate(d.getDate() - (100 - i));


            return {
              mean: this.incrementDecrement() ? start -= 1 : start += 1,
              time: d
            };
          }),
          device_id: '1',
          subsystem_id: '1',
          control_instance: 1

        }
      );
    }

    return result;
  }

}
