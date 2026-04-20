import { Component, NgZone, signal } from '@angular/core';
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
  IonActionSheet,
  ActionSheetButton,
} from '@ionic/angular/standalone';
import { PhotoService, UserPhoto } from '../services/photo.service';
import { addIcons } from 'ionicons';
import { camera, close, share, trash } from 'ionicons/icons';
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
    IonActionSheet,
    NgFor,
  ],
})
export class Tab2Page {
  public isActionSheetOpen = signal(false);
  public isAlertOpen = signal(false);
  public photo = signal<UserPhoto | null>(null);
  public position = signal<number>(0);
  public alertButtons = signal<ActionSheetButton[]>([
    {
      text: 'Cancelar',
      role: 'cancel',
    },
    {
      text: 'Excluir',
      role: 'destructive',
      handler: async () => {
        if (this.photo() && this.position() !== undefined) {
          await this.photoService.deletePhoto(this.photo()!, this.position());
          await this.photoService.loadSaved();
        }
      },
    },
  ]);

  public actionSheetButtons = signal<ActionSheetButton[]>([
    {
      text: 'Compartilhar',
      icon: 'share',
      handler: () => {
        this.photoService.sharePhoto(this.photo()!);
      },
    },
    {
      text: 'Excluir',
      role: 'destructive',
      icon: 'trash',
      handler: () => {
        this.confirmeDeletePhoto();
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
  ]);
  constructor(
    public photoService: PhotoService,
  ) {
    addIcons({ camera, share, close, trash });
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  public async confirmeDeletePhoto() {
    this.isAlertOpen.set(true);
  }

  setCloseAlert() {
    this.isAlertOpen.set(false);
  }


  setCloseActionSheet() {
    this.isActionSheetOpen.set(false);
  }

  public async showActionSheet(photo: UserPhoto, position: number) {
    this.photo.set(photo);
    this.position.set(position);
    this.isActionSheetOpen.set(true);
  }
}
