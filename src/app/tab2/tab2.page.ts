import { Component, NgZone } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonAlert, 
  IonButton,
  Platform,
} from '@ionic/angular/standalone';
import { PhotoService, UserPhoto } from '../services/photo.service';
import { addIcons } from 'ionicons';
import { camera, close, share, trash } from 'ionicons/icons';
import { ActionSheetController } from '@ionic/angular';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonAlert, 
    IonButton,
    NgFor,
  ],
})
export class Tab2Page {
  constructor(
    private platform: Platform,
    public photoService: PhotoService,
    public actionSheetController: ActionSheetController,
    private zone: NgZone,
  ) {
    addIcons({ camera, share, close, trash });
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }


  public async showActionSheet(photo: UserPhoto, position: number) {
    console.log('Clicou');
    
    await this.platform.ready(); // 🔥 ESSENCIAL

    this.zone.run(async () => {
      console.log('Chamou o zone.run');
      console.log('ion-app:', document.querySelector('ion-app'));
      this.actionSheetController
        .create({
          header: 'Qual ação deseja realizar?',
          animated: false,
          buttons: [
            {
              text: 'Compartilhar',
              icon: 'share',
              handler: () => {
                this.photoService.sharePhoto(photo);
              },
            },
            {
              text: 'Excluir',
              role: 'destructive',
              icon: 'trash',
              handler: () => {
                this.photoService.deletePhoto(photo, position);
              },
            },
            {
              text: 'Cancelar',
              icon: 'close',
              role: 'cancel',
              handler: () => {
                // Nothing to do, action sheet is automatically closed
              },
            },
          ],
        })
        .then((actionSheet) => {
          console.log('action');

          actionSheet.present();
        })
        .catch((error) => {
          console.error('Error presenting action sheet:', error);
        });

      console.log('Oi');
    });
  }
}
