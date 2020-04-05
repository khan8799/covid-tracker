import { Component, OnInit } from '@angular/core';
import { CameraService } from '../services/camera.service';
import { NavController } from '@ionic/angular';
import { NativeGeocoder, NativeGeocoderOptions, NativeGeocoderResult } from '@ionic-native/native-geocoder/ngx';
import { Geolocation} from '@ionic-native/geolocation/ngx';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements OnInit {
  picture       = '';
  isCameraOpen  = false;
  showIcons     = false;

  // Flash Mode
  flashModes: Promise<any>;
  activeFlash = '';
  address: any = '';
  lat;
  long;

  constructor(
    private navController: NavController,
    private customizeCameraService: CameraService,
    public geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
  ) { }

  ngOnInit() {
    const token = localStorage.getItem('token');
    localStorage.clear();
    localStorage.setItem('token', token);
    this.openCamera();
  }

  openCamera() {
    this.customizeCameraService.openCameraPreview().then(
      (res) => {
        this.isCameraOpen = true;
        this.showIcons    = true;
      },
      (err) => {
        if (err === 'Illegal access') {
          this.navController.navigateRoot(['/user-detail']);
        }
      }
    );
  }

  takePicture() {
    this.customizeCameraService.takePicture().then(
      (imageData) => {
        this.customizeCameraService.stopCamera().then(
          (res) => {
            this.picture = 'data:image/jpeg;base64,' + imageData;
            this.isCameraOpen = false;
            this.checkLocation();
          },
          (err) => console.log(err)
        );
      },
      (err) => console.log(err)
    );
  }

  stopCamera() {
    this.isCameraOpen = false;
    return this.customizeCameraService.stopCamera();
  }

  getFlashMode() {
    this.customizeCameraService.getFlashMode().then(
      activeFlash => {
        this.activeFlash  = activeFlash;
        this.customizeCameraService.setFlashMode(this.activeFlash);

        this.flashModes   = this.customizeCameraService.getSuppportedFlashModes();
      }
    );
  }

  setFlashMode(flashType: string) {
    this.customizeCameraService.setFlashMode(flashType);
  }

  refresh() {
    this.picture = '';
    this.openCamera();
  }

  checkLocation() {
    this.geolocation
        .getCurrentPosition({ enableHighAccuracy: true})
        .then((resp) => {
          this.lat = resp.coords.latitude;
          this.long = resp.coords.longitude;
          this.getAddressFromCoords(resp.coords.latitude, resp.coords.longitude);
        })
        .catch((error) => console.log(error));
  }

  getAddressFromCoords(lattitude, longitude) {
    console.log('getAddressFromCoords ' + lattitude + ' ' + longitude);
    const options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 1
    };

    this.nativeGeocoder
        .reverseGeocode(lattitude, longitude, options)
        .then((result: NativeGeocoderResult[]) => {
          console.log(result);
          this.address = '';
          const responseAddress = [];
          for (const [key, value] of Object.entries(result[0])) {
            if (value.length > 0) {
              responseAddress.push(value);
            }
          }
          responseAddress.reverse();
          for (const value of responseAddress) {
            this.address += value + ', ';
          }
          this.address = this.address.slice(0, -2);
          console.log(this.address);
          this.navigate();
        })
        .catch((error: any) =>  this.address = 'Address Not Available!');
  }

  navigate() {
    localStorage.setItem('image', this.picture);
    localStorage.setItem('address', this.address);
    localStorage.setItem('lat', this.lat);
    localStorage.setItem('long', this.long);
    this.navController.navigateBack(['/user-detail']);
  }

}
