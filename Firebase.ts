import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCNmx8CemcJ_6NREITxm9DLt8EiIKTkGdI",
  authDomain: "ushlaydigansayt.firebaseapp.com",
  projectId: "ushlaydigansayt",
  storageBucket: "ushlaydigansayt.firebasestorage.app",
  messagingSenderId: "1053168027889",
  appId: "1:1053168027889:web:3748436f86b746fde5c150",
  measurementId: "G-0MZBLQ3D4K"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);