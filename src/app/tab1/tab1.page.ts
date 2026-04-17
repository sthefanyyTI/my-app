import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardContent} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader,
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonCard, 
    IonCardHeader,
    IonCardContent, 
  ],
  
})
export class Tab1Page {
  constructor() {}
}
