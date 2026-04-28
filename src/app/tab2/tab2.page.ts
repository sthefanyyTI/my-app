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
  IonModal,
  IonButtons,
  IonFooter
} from '@ionic/angular/standalone';
import { PhotoService, UserPhoto } from '../services/photo.service';
import { addIcons } from 'ionicons';
import { camera, close, information, pencil, share, trash } from 'ionicons/icons';
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
    IonModal,
    IonButtons,
    NgFor,
    IonFooter,
  ],
})
export class Tab2Page {
  public isActionSheetOpen = signal(false);
  public isAlertOpen = signal(false);
  public isModalOpen = signal(false);
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
          this.setCloseAlert();
          this.setCloseModal();
        }
      },
    },
  ]);

  public actionSheetButtons = signal<ActionSheetButton[]>([
    {
      text: 'Compartilhar',
      icon: 'share',
      handler: () => {
        this.sharePhoto(this.photo()!);
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

  constructor(public photoService: PhotoService) {
    addIcons({ camera, share, close, trash, information, pencil });
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  async editPhoto(photo: UserPhoto) {
    const editedPhoto = await this.photoService.editPhoto(photo);
    this.photo.update(() => editedPhoto);
    if (editedPhoto) {
      await this.photoService.loadSaved();  
    } else {
      console.error('Failed to edit photo');  
    }
  }

  showPhotoInfo() {
    const photo: UserPhoto = this.photo()!;
    
    const info = `
      Caminho: ${photo.fileName}
      Criada em: ${new Date(photo.createdAt).toLocaleString()}
      Atualizada em: ${new Date(photo.updatedAt).toLocaleString()}
      Tamanho: ${photo.size} bytes
      Formato: ${photo.format}
      Plataforma: ${photo.platform}
      Dispositivo: ${photo.device}
      Localização: ${photo.location ? `Lat: ${photo.location.latitude}, Lon: ${photo.location.longitude}` : 'N/A'}
    `;
    alert(info);
  }

  sharePhoto(photo: UserPhoto) {
    this.photoService.sharePhoto(photo);
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
    this.isModalOpen.set(true);
  }
  setCloseModal() {
    this.isModalOpen.set(false);
  }
}
