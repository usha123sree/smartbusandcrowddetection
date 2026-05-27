// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
const firebaseConfig = {
  apiKey: "AIzaSyB_seppt-zrfIHatdC2GEDzz496bBJdn-A",
  authDomain: "smart-bus-tracking-app-b6595.firebaseapp.com",
  databaseURL: "https://smart-bus-tracking-app-b6595-default-rtdb.firebaseio.com",
  projectId: "smart-bus-tracking-app-b6595",
  storageBucket: "smart-bus-tracking-app-b6595.firebasestorage.app",
  messagingSenderId: "387682411914",
  appId: "1:387682411914:web:1980a9de6275d852605473"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);