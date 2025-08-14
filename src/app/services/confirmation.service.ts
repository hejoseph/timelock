import { Injectable, createComponent, EnvironmentInjector, ApplicationRef } from '@angular/core';
import { Subject } from 'rxjs';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private componentRef: any;
  private confirmationSubject!: Subject<boolean>;

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef
  ) { }

  open(title: string, message: string, confirmText: string = 'Delete'): Promise<boolean> {
    this.confirmationSubject = new Subject<boolean>();

    const hostElement = document.createElement('div');
    document.body.appendChild(hostElement);

    const componentRef = createComponent(ConfirmationDialogComponent, {
      environmentInjector: this.injector,
      hostElement: hostElement
    });

    componentRef.instance.title = title;
    componentRef.instance.message = message;
    componentRef.instance.confirmText = confirmText;

    componentRef.instance.onConfirm.subscribe(() => {
      this.confirmationSubject.next(true);
      this.confirmationSubject.complete();
      this.destroyComponent(componentRef, hostElement);
    });

    componentRef.instance.onCancel.subscribe(() => {
      this.confirmationSubject.next(false);
      this.confirmationSubject.complete();
      this.destroyComponent(componentRef, hostElement);
    });

    this.appRef.attachView(componentRef.hostView);
    this.componentRef = componentRef;

    return this.confirmationSubject.toPromise().then(value => value || false);
  }

  private destroyComponent(componentRef: any, hostElement: HTMLElement): void {
    if (componentRef) {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      document.body.removeChild(hostElement);
    }
  }
}
