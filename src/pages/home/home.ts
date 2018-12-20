import { Component,NgZone } from "@angular/core";
import {
  NavController,
  ModalController,
  AlertController,
  ViewController,
  App
} from "ionic-angular";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import { LogProvider } from "../../providers/log/log";
import { LoginPage } from "../../pages/login/login";
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection
} from "angularfire2/firestore";
import { Subscription } from "rxjs/Subscription";
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse  } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import { NativeGeocoder, NativeGeocoderReverseResult, NativeGeocoderForwardResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  userDetails: any;
  responseData: any;
  public watch: any;

  userPostData = { user_id: "", token: "" };
  loginData = {};
  actuario: AngularFirestoreDocument<any>;
  public items: any = [];
  private doc: Subscription;
  num_expe: any;
  public lat: number = 0;
  public lng: number = 0;
  itemsCollection: AngularFirestoreCollection<any>; //Firestore collection
  items2: Observable<Items[]>;
  fecha: any;
   constructor(
    public navCtrl: NavController,
    public http: Http,
    public viewCtrl: ViewController,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public user: LogProvider,
    public modal: ModalController,
    public app: App,
    private db: AngularFirestore,
    public backgroundGeolocation: BackgroundGeolocation,
    public zone: NgZone,
    public geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder
  ) {}
  ionViewWillEnter() {
    this.load();
  
    // this.user.start();
   
   
  }
  doRefresh(refresher) {
    console.log('Begin async operation', refresher);
    this.load();
    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }
  load() {
    
    if (this.user.activo) {
      let toke_user = this.user.token;
      let id_user = this.user.id_usuario;
      //cambiar cuando genere APK  187234.163.188.
      let url = `http://iustartech.com/iustargen/Api-Rest/index.php/expediente/obtener_expedientes/${toke_user}/${id_user}`;

      console.log("URL " + url);
      this.http.get(url).map(res => res.json()).subscribe(data => {
          this.items = data;
          console.log(this.user.nombre_actuario + " ");
          var data_array = [];
          for (var i = 0; i < data.length; i++) {
            data_array.push({
              id_expediente: data[i].id_expediente,
              demandado: data[i].demandado,
              direccion: data[i].direccion,
              anio:data[i].anio,
              status: data[i].status,
              tipo_juicio: data[i].tipo_juicio
            });
          }
          
          this.actuario = this.db.doc(`/usuarios/${this.user.nombre_actuario}`);
          this.itemsCollection = this.db.collection(`usuarios`); //ref()
          this.items2 = this.itemsCollection.valueChanges()
          console.log("datos--" + this.items2);
        this.registra_firebase(this.user.nombre_actuario, data_array);
        //  this.verifica_en_firebase(this.user.nombre_actuario,data_array);
         
        }); 
        

    }
   
  }
   //verifica existencia de expedientes
   registra_firebase(nombre_actuario, data_array) {
    ``
    console.log("data->ArrayHome" + JSON.stringify(data_array));
    this.db.collection("usuarios").doc(nombre_actuario).set({
      data_array
    },{merge:true}).then(function() {
      console.log("Ok");
      })
      .catch(function(error) {
        console.log("Error al subir datos! " + error);
      });
      //envio datos;
      this.user.actualiza_status(data_array);
}

 //funcion para ocultar menu pie de pagina
 oculta_tabs() {
  let elements = document.querySelectorAll(".tabbar");

  if (elements != null) {
    Object.keys(elements).map(key => {
      elements[key].style.display = "none";
    });
  }
}
addEntry() {
  this.navCtrl.push("ModalDetalleSitioPage");
}
viewEntry(param) {
  this.navCtrl.push("ModalDetalleSitioPage", param);
  console.log(param);
  
}
verifica_firebase(nombre){

var docRef = this.db.collection("usuarios").doc(nombre).ref;

    docRef.get().then(function(doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data());
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}/*
start(marker,data_array) { 
  console.log("datos--> 3 start " + JSON.stringify(marker));
  let markes;
  markes = marker;
  this.db.collection("usuarios").doc(this.user.nombre_actuario).set({
    data_array,
    markes
  },{merge:true})
  .then(function() {})
  .catch(function(error) {
    console.log("Error al subir datos! " + error);
  });
  // Compruebo si esta habilidata la opcion de localizacion

 this.backgroundGeolocation.isLocationEnabled()
 .then((activado) =>{
     //si esta activado
   if(activado){

     let config = {
       desiredAccuracy: 0,
       stationaryRadius: 1,
       distanceFilter: 1,
       debug: false,
       interval: 50000
     };
     let config = {
      desiredAccuracy: 0,
      stationaryRadius: 0,
      distanceFilter: 0,
      debug: false,
      interval:0
    };
     //Geolocalizacion en segundo Plano      
     this.backgroundGeolocation
     .configure(config)
     .subscribe((location) => {
       console.log("latitud actualizacion background 1 "+location.latitude);
      
       // 
       let today = new Date();
       let dd = today.getDate();
       let mm = today.getMonth()+1; //January is 0!
       let yyyy = today.getFullYear();
       var fecha = dd+'/'+mm+'/'+yyyy;
       
       //hour
       let hours =today.getHours()+":"+today.getMinutes()+":"+today.getSeconds(); 

       this.zone.run(() => {
       this.lat = location.latitude;
       this.lng = location.longitude;
       });
       let options: NativeGeocoderOptions = {
        useLocale: true,
        maxResults: 5
    };
    
    this.nativeGeocoder.reverseGeocode(this.lat, this.lng, options)
      .then((result: NativeGeocoderReverseResult[]) =>{
      let  direction = JSON.stringify(result[0].locality ) +  ", "+JSON.stringify(result[0].subLocality )+","+ JSON.stringify(result[0].thoroughfare)+ ", "+JSON.stringify(result[0].subThoroughfare) ;
       // console.log("direction->" +JSON.stringify(result[0].locality ) +  "  "+JSON.stringify(result[0].subLocality )+" "+ JSON.stringify(result[0].thoroughfare)+ " "+JSON.stringify(result[0].subThoroughfare) );
      
       console.log("direction->"+direction);
       this.actuario.update({
           lat: this.lat,
           lng: this.lng,
       });
          markes.push({
            latitud: this.lat,
            longitud: this.lng,
            date: fecha,
            hours:hours,
            direction:direction
          });
        
            this.db.collection("usuarios").doc(this.user.nombre_actuario).set({
              markes
            },{merge:true})
            .then(function() {})
            .catch(function(error) {
              console.log("Error al subir datos! " + error);
            });
     })
      .catch((error: any) => console.log(error));

           
       
       });
 
     // start recording location
     this.backgroundGeolocation.start();
   //  this.backgroundMode.disableWebViewOptimizations();
    /* let options = {
       frequency: 300000,
       enableHighAccuracy: true,
       maximumAge: 60000,
       timeout:300000,
       distanceFilter: 1

     };
     let options = {
      frequency: 30000,
      enableHighAccuracy: true,
      maximumAge: 30000

    };
       //cuando la aplicacion esta abierta y activada
     this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined)
     .subscribe((position: Geoposition) => {
       console.log("latitud actualizacion 2 "+position.coords.latitude + "  " + position.coords.longitude);
  
       //
       let today = new Date();
       let dd = today.getDate();
       let mm = today.getMonth()+1; //January is 0!
       let yyyy = today.getFullYear();
       var fecha = dd+'/'+mm+'/'+yyyy;
       
       //hour
       let hours =today.getHours()+":"+today.getMinutes()+":"+today.getSeconds(); 
       let options: NativeGeocoderOptions = {
        useLocale: true,
        maxResults: 5
    };
    
    this.nativeGeocoder.reverseGeocode(this.lat, this.lng, options)
      .then((result: NativeGeocoderReverseResult[]) =>{
      let  direction = JSON.stringify(result[0].locality ) +  "  "+JSON.stringify(result[0].subLocality )+" "+ JSON.stringify(result[0].thoroughfare)+ " "+JSON.stringify(result[0].subThoroughfare) ;
       // console.log("direction->" +JSON.stringify(result[0].locality ) +  "  "+JSON.stringify(result[0].subLocality )+" "+ JSON.stringify(result[0].thoroughfare)+ " "+JSON.stringify(result[0].subThoroughfare) );
         //actualizo dato en firebase
      console.log("direction->" + direction);
      this.actuario.update({
            lat: position.coords.latitude,
            lng: position.coords.longitude
        });
        //para poder mapear en un mapa se guardan los datos
        markes.push({
             latitud:position.coords.latitude,
             longitud:position.coords.longitude,
             date:fecha,
             hours: hours,
             direction:direction
           });
           
           this.db.collection("usuarios").doc(this.user.nombre_actuario).set({
             markes
           },{merge:true})
           .then(function() {})
           .catch(function(error) {
             console.log("Error al subir datos! " + error);
           });
     })
      .catch((error: any) => console.log(error));
     
     });
 
   }else {
     this.backgroundGeolocation.showLocationSettings();
   }
 }) 
}*/

}
interface Items {
  description: string;
  itemid: number;
 }