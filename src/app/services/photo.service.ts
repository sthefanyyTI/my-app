import { Injectable, signal } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  EditPhotoResult,
  MediaResult,
  Photo,
} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export interface UserPhoto {
  fileName: string;
  filepath: string;
  webviewPath?: string;
  realPath: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  format: string;
  platform: string;
  device: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos = signal<UserPhoto[]>([]);

  private PHOTO_STORAGE: string = 'photos';

  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  public async addNewToGallery() {
    const capturedPhoto = await Camera.takePhoto({
      quality: 100,
      editable: 'no',
      saveToGallery: true,
    });

    const savedImageFile = await this.savePicture(capturedPhoto);

    this.photos.update((photos) => [savedImageFile, ...photos]);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    return savedImageFile;
  }

  private async savePicture(photo: MediaResult, userEditedPhoto?: UserPhoto): Promise<UserPhoto> {
    let base64Data: string | Blob;

    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.uri!,
      });

      base64Data = file.data;
    } else {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      base64Data = (await this.convertBlobToBase64(blob)) as string;
    }

    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Library,
    });

    if (this.platform.is('hybrid')) {
      return {
        fileName,
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(photo.webPath!),
        realPath: photo.uri!,
        createdAt: userEditedPhoto ? userEditedPhoto.createdAt : Date.now(),
        updatedAt: Date.now(),
        size: photo.metadata?.size || 0,
        format: 'jpeg',
        platform: userEditedPhoto ? userEditedPhoto.platform : (this.platform.is('hybrid') ? 'hybrid' : 'web'),
        device: userEditedPhoto ? userEditedPhoto.device : (this.platform.is('hybrid') ? Capacitor.getPlatform() : 'web'),
      };
    } else {
      return {
        fileName,
        filepath: fileName,
        webviewPath: photo.webPath,
        realPath: photo.webPath!,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: photo.metadata?.size || 0,
        format: 'jpeg',
        platform: this.platform.is('hybrid') ? 'hybrid' : 'web',
        device: this.platform.is('hybrid') ? Capacitor.getPlatform() : 'web',
      };
    }
  }

  private convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }

  public async loadSaved() {
    const { value: photoList } = await Preferences.get({
      key: this.PHOTO_STORAGE,
    });
    this.photos.set((photoList ? JSON.parse(photoList) : []) as UserPhoto[]);

    if (!this.platform.is('hybrid')) {
      for (let photo of this.photos()) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Library,
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  async editPhoto(photo: UserPhoto) {
    const editedPhoto = await Camera.editURIPhoto({
     uri: photo.realPath,
     includeMetadata: true,
     saveToGallery: true
    });

    this.deletePhoto(photo, this.photos().indexOf(photo));
    
    const savedImageFile = await this.savePicture(editedPhoto, photo);
    this.photos.update((photos) => [savedImageFile, ...photos]);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    return savedImageFile;
  }

  public async deletePhoto(photo: UserPhoto, position: number) {
    this.photos.update((photos) =>
      photos.filter((_, index) => index !== position),
    );

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    if (this.platform.is('hybrid')) {
      const fileName = photo.filepath.substr(
        photo.filepath.lastIndexOf('/') + 1,
      );

      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Library,
      });
    } else {
      try {
        await Filesystem.deleteFile({
          path: photo.filepath!,
          directory: Directory.Library,
        });
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  }

  public async sharePhoto(photo: UserPhoto) {
    await Share.share({
      title: 'Compartilhar imagem',
      text: 'Veja esta foto que tirei!',
      url: photo.realPath,
      // files: [photo.realPath],
      dialogTitle: 'Compartilhar imagem',
    });
  }
}
