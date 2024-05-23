/*
* Name : auth.js
* Author : JSO
* Modified : 23.05.2024
* */

import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { app } from "./initializeFirebase.js";
import { CreateUserProfileDocument } from "./firestore.js"

const auth = getAuth(app);

let logged;
let currentUser;

// Define the custom event
const loggedChangeEvent = new Event('loggedChange');

// Dispatch the event whenever the value of logged changes
// For example, if you have a function that updates the login status, you can dispatch the event after the update
function updateLoginStatus(newStatus) {
    logged = newStatus;
    // Dispatch the custom event
    window.dispatchEvent(loggedChangeEvent);
}

// Check Auth state and change "logged" value
onAuthStateChanged(auth, function (user) {
    if (user) {
        currentUser = user;
        updateLoginStatus(true);
        console.log("user logged in");
    } else {
        currentUser = "";
        updateLoginStatus(false);
        console.log("user logged out");
    }
});

/**
 * Function to register
 */
function Register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const userName = document.getElementById('register-username').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(async (result) => {
            await CreateUserProfileDocument(result.user, userName);
        })
        .catch((error) => {// An error happened // Handle the errors here
            let errorMessage = "";
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "This email is already in use.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "This email address is not valid.";
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = "Operation not allowed. Please contact support.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "The password is too weak.";
                    break;
                default:
                    errorMessage = "An unknown error occurred.";
            }
            console.error(error);
            alert(errorMessage); // Or update the UI to show the error message
        })
}

/**
 * Function to log in with email and password
 */
function Login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((result) => {
            console.log("Logged in : " + result.user.displayName)
            //window.location.hash = "home";
        })
        .catch((error) => {
            let errorMessage = "";
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No user found with this email.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "This email address is not valid.";
                    break;
                case 'auth/invalid-credential':
                    errorMessage = "Invalid credential.";
                    break;
                default:
                    errorMessage = "An unknown error occurred.";
            }
            console.error(error);
            alert(errorMessage); // Or update the UI to show the error message
        })
}

/**
 * Function to log in with Google
 */
function GoogleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(async(result) => {
            await CreateUserProfileDocument(result.user, result.user.displayName);
            console.log("Logged in with Google : " + result.user.displayName);
            window.location.hash = "home";
        })
        .catch((error) => {// Handle Errors here.
            console.error(error);
        })
}

/**
 * Function to log out
 */
function Logout() {
    signOut()
        .then(() => {// Sign-out successful.
            console.log("SignOUT successful");
            //window.location.href = '#loginOrRegister';
        })
        .catch((error) => {// An error happened.
            console.error(error);
        });
    // After logout actions are complete, change the hash to #loginOrRegister
    window.location.hash = "#loginOrRegister";
}


export { logged, currentUser, Register, Login, GoogleLogin, Logout };