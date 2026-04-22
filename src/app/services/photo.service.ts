import { Injectable, signal } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  realPath: string;
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
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
      allowEditing: true,
    });

    const savedImageFile = await this.savePicture(capturedPhoto);

    this.photos.update((photos) => [savedImageFile, ...photos]);
    console.log(this.photos());

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });
  }

  private async savePicture(photo: Photo) {
    let base64Data: string | Blob;

    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!,
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
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        realPath: photo.path!,
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        realPath: photo.webPath!,
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
          directory: Directory.Data,
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  public async deletePhoto(photo: UserPhoto, position: number) {
    this.photos.update((photos) =>
      photos.filter((_, index) => index !== position),
    );

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
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
