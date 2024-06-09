/*
* Name : initializeFirebase.js
* Author : JSO
* Modified : 23.05.2024
* */

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
const firebaseConfig = {
    apiKey: "AIzaSyDVW4ETUNqrCa_YZFtn3SLkE2BWvwMilrI",
    authDomain: "webchat-tpi.firebaseapp.com",
    databaseURL: "https://webchat-tpi-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "webchat-tpi",
    storageBucket: "webchat-tpi.appspot.com",
    messagingSenderId: "475718653980",
    appId: "1:475718653980:web:d178fd92c04b6a840ba7d9"
};
const app = initializeApp(firebaseConfig);
export { app };