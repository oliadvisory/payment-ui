import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class PaymentService {
  constructor(private http: HttpClient) {}
  private base = 'http://xlear-car-wash.wl.r.appspot.com';
  private pingUrl = `${this.base}/system/ping`;

  getPing() {
    return this.http.get<string>(this.pingUrl);
  }
}
