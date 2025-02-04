import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: AngularFirestore) { }

  getData(collectionName: string) {
    return this.firestore.collection(collectionName).valueChanges();
  }

  // Example: Add data to a Firestore collection
  addData(collectionName: string, data: any) {
    return this.firestore.collection(collectionName).add(data);
  }
}
