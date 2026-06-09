import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQxzaRMNhfMRaIaHe6ZzM_p5H7pV-OdIY",
  authDomain: "loraiot-8c272.firebaseapp.com",
  projectId: "loraiot-8c272",
  storageBucket: "loraiot-8c272.firebasestorage.app",
  messagingSenderId: "677886597190",
  appId: "1:677886597190:web:8181bb5b5ebbb436411247",
  measurementId: "G-WN4RRLLXSN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
