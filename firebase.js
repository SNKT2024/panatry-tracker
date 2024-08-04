// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbEU4xj4xiIsgtgr_Bfu2j6DjrASO_vFY",
  authDomain: "inventory-managment-a6e2d.firebaseapp.com",
  projectId: "inventory-managment-a6e2d",
  storageBucket: "inventory-managment-a6e2d.appspot.com",
  messagingSenderId: "566118189702",
  appId: "1:566118189702:web:8be220a1d30b18df0bdf07",
  measurementId: "G-V760NRY9L9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };
