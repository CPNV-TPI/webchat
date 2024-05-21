import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {  getFirestore, collection, doc, getDoc, setDoc, onSnapshot, orderBy, query, runTransaction, Timestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// Define the custom event
const loggedChangeEvent = new Event('loggedChange');

// Dispatch the event whenever the value of logged changes
// For example, if you have a function that updates the login status, you can dispatch the event after the update
function updateLoginStatus(newStatus) {
    logged = newStatus;
    // Dispatch the custom event
    window.dispatchEvent(loggedChangeEvent);
}

let logged;
let currentUser;
let currentGroupID;
let currentGroupListener; // Store reference to the current group listener

const firebaseConfig = {
    apiKey: "AIzaSyDVW4ETUNqrCa_YZFtn3SLkE2BWvwMilrI",
    authDomain: "webchat-tpi.firebaseapp.com",
    databaseURL: "https://webchat-tpi-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "webchat-tpi",
    storageBucket: "webchat-tpi.appspot.com",
    messagingSenderId: "475718653980",
    appId: "1:475718653980:web:d178fd92c04b6a840ba7d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);// Initialize Cloud Firestore and get a reference to the service
const storage = getStorage();

export { logged, loggedChangeEvent};

document.addEventListener('DOMContentLoaded', function () {
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

    function checkActionAndUpdate() {
        // Get the value of the 'action' query parameter from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        const action = urlParams.get('action');

        // Check the value of the 'page' parameter and take appropriate action
        switch (page) {
            case "discussions":
                // Example usage:
                FetchDiscussions().then(discussions => {
                    DisplayDiscussions(discussions, 'Open'); // Display open discussions
                    // displayDiscussions(archivedDiscussions, 'Archived'); // Display archived discussions
                });
                break;
            case "profile":
                DisplayProfileSettings();//Fetch profile settings property and display them
                break;
            default:
                // Handle other cases or default behavior
                break;
        }

        // Check the value of the 'page' parameter and take appropriate action
        switch (action) {
            case "addContact":
                //AddContact();
                break;
            case "blockContact":
                //BlockContact();
                break;
            case 'seeContactProfile':
                //SeeContactProfile()
                break;
            case "createDiscussion":
                //CreateDiscussions();
                break;
            case "archiveDiscussion":
                //ArchiveDiscussions();
                break;
            default:
                // Handle other cases or default behavior
                break;
        }
    }

    // Add event listener for the 'popstate' event
    window.addEventListener('popstate', checkActionAndUpdate);

    // Call the function initially to handle the current URL state
    checkActionAndUpdate();

    // Fetch discussions from Firestore
    function FetchDiscussions() {
        return new Promise((resolve, reject) => {

            // Get the current user's discussions
            const userId = currentUser.uid;
            const userRef = collection(db,'Users').doc(userId);

            userRef.get().then(doc => {
                if (doc.exists) {
                    const discussions = doc.data().Discussions;
                    const promises = discussions.map(discussionId => {
                        return collection(db,'Discussions').doc(discussionId).get();
                    });
                    Promise.all(promises).then(snapshot => {
                        const discussionsData = snapshot.map(doc => ({ id: doc.id, data: doc.data() }));
                        resolve(discussionsData);
                    }).catch(error => {
                        reject(error);
                    });
                } else {
                    reject('User document not found');
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    // Fetch messages of a specific discussion from Firestore
    function fetchMessages(discussionId) {
        // Create a reference to the messages collection under the specified group document
        const messagesRef = collection(db, "Discussions", discussionId, "Messages");
        // Create a query to order messages by timestamp in ascending order
        const q = query(messagesRef, orderBy("Timestamp", "asc"));

        return onSnapshot(q, snapshot => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push(doc.data());
            });
            // Call the displayMessages function to display the messages
            displayMessages(messages);
        }, error => {
            console.error('Error fetching messages:', error);
        });
    }

    // Display discussions
    function DisplayDiscussions(discussions, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear previous content

        discussions.forEach(discussion => {
            const discussionDiv = document.createElement('div');
            discussionDiv.classList.add('chat-list');

            const discussionLink = document.createElement('a');
            discussionLink.href = '#';
            discussionLink.classList.add('d-flex', 'align-items-center');
            discussionLink.addEventListener('click', () => {
                displayMessages(discussion.id);
            });

            const userImg = document.createElement('img');
            userImg.classList.add('img-fluid');
            userImg.src = 'https://mehedihtml.com/chatbox/assets/img/user.png';
            userImg.alt = 'user img';

            const discussionDetails = document.createElement('div');
            discussionDetails.classList.add('flex-grow-1', 'ms-3');

            const discussionName = document.createElement('h3');
            discussionName.textContent = discussion.data().Name;

            const lastAction = document.createElement('p');
            lastAction.textContent = 'last action: '; // Add last action here

            discussionDetails.appendChild(discussionName);
            discussionDetails.appendChild(lastAction);

            discussionLink.appendChild(userImg);
            discussionLink.appendChild(discussionDetails);

            discussionDiv.appendChild(discussionLink);
            container.appendChild(discussionDiv);
        });
    }

    // Display messages of a discussion
    function displayMessages(discussionId) {
        const msgBody = document.querySelector('.msg-body ul');
        msgBody.innerHTML = ''; // Clear previous messages

        fetchMessages(discussionId).then(messages => {
            let currentDate = null;
            messages.forEach(message => {
                const messageData = message.data;
                const timestamp = new Date(messageData.Timestamp.toDate());
                const messageDate = timestamp.toDateString();

                // Display date divider if it's a new date
                if (messageDate !== currentDate) {
                    const divider = document.createElement('li');
                    divider.classList.add('divider');
                    divider.innerHTML = `<h6>${messageDate}</h6>`;
                    msgBody.appendChild(divider);
                    currentDate = messageDate;
                }

                // Create message element
                const messageLi = document.createElement('li');
                messageLi.classList.add(messageData.Auth === 'User_username' ? 'sender' : 'reply');
                messageLi.innerHTML = `<p>${messageData.Text}</p><span class="time">${timestamp.toLocaleTimeString()}</span>`;
                msgBody.appendChild(messageLi);
            });
        }).catch(error => {
            console.error('Error fetching messages:', error);
        });
    }


    function DisplayProfileSettings() {
        console.info("DisplayProfileSettings()");
    }

    /**
     * Add listener to all click event and call the correct function by checking the target id
     */
    document.addEventListener('click', function (event) {
        // Check if the clicked element has an id
        if (event.target && event.target.id) {
            const targetId = event.target.id;
            switch (targetId) {
                case 'register_btn':
                    // Validate and register user
                    if (validateRegisterForm()) {
                        Register();
                    }
                    break;
                case 'login_btn':
                    // Validate and login user
                    if (validateLoginForm()) {
                        Login();
                    }
                    break;
                case 'google_login_btn':
                    GoogleLogin();
                    break;
                case 'logout_btn':
                    Logout();
                    break;
                case 'send_msg_btn':
                    //SendMessage();
                    break;
                case 'add_contact_btn':
                    break;
                case 'remove_contact_btn':
                    break;
                case 'block_contact_btn':
                    break;
                case 'create_discussion_btn':
                    break;
                default:
                    break;
            }
        }
    });

    // Function to validate the register form
    function validateRegisterForm() {
        let form = document.getElementById('register_form');

        // Access form fields by their names
        const nameField = form.elements['register-username'];
        const emailField = form.elements['register-email'];
        const passwordField = form.elements['register-password'];

        // Perform validation
        if (!nameField.value.trim() || !emailField.value.trim() || !passwordField.value.trim()) {
            alert('Please fill in all fields.');
            return false; // Return false to indicate validation failure
        }

        return true; // Return true to indicate validation success
    }

    // Function to validate the login form
    function validateLoginForm() {
        let form = document.getElementById('login_form');

        // Access form fields by their names
        const emailField = form.elements['login-email'];
        const passwordField = form.elements['login-password'];

        // Perform validation
        if (!emailField.value.trim() || !passwordField.value.trim()) {
            alert('Please fill in all fields.');
            return false; // Return false to indicate validation failure
        }

        // Add more validation logic as needed

        return true; // Return true to indicate validation success
    }

    /**
     * Function to register
     */
    function Register() {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const userName = document.getElementById('register-username').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((result) => {
                CreateUserDocument(result.user, userName);
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

        console.log(email, password);

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
                // This gives you a Google Access Token. You can use it to access the Google API.
                //const credential = result.credential;
                // Check if the user document exists in Firestore
                const userDocRef = doc(db, "Users", result.user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (!userDocSnap.exists()) {
                    CreateUserDocument(result.user, result.user.displayName);
                }
                console.log("Logged in with Google : " + result.user.displayName);
                window.location.hash = "home";
            })
            .catch((error) => {// Handle Errors here.
                console.error(error);
            })
    }

    // Function to create a document in the "Users" collection
    function CreateUserDocument(user, userName) {
        // Ensure the user object has an uid property
        if (!user || !user.uid) {
            console.error("Invalid user object:", user);
            return;
        }

        const userDocRef = doc(db, "Users", user.uid); // Create a document reference with user's ID

        // Create a new document with the user's ID
        setDoc(userDocRef, {
            Discussions: [],
            ArchivedDiscussions: [],
            Contacts: [],
            BlockedContacts: [],
            CreationTimestamp: Timestamp.now(),
            LastActionTimestamp: Timestamp.now(),
            ProfilePhotoUrl: "https://firebasestorage.googleapis.com/v0/b/webchat-tpi.appspot.com/o/ProfilePhotos%2FDefaultProfilePhoto1.jpg?alt=media&token=3eb0960d-24c1-4fd7-9278-8416e1913a23",
            UserName: userName || GenerateRandomUsername()
        })
            .then(() => {
                console.log("Document successfully created in Users collection!");
                AddToDiscussionsAndRemoveFromArchived(user.uid, "VTlG5Gv8X5JLTO8MLjyb")
            })
            .catch((error) => {
                console.error("Error creating document: ", error);
            });
    }

    // Function to update a document in the "Users" collection
    function UpdateUserDocument(userId, fieldsToUpdate) {
        // Reference to the "Users" collection
        const usersCollection = collection(db,"Users");

        // Create a reference to the user's document
        const userDocRef = doc(usersCollection, userId);

        // Update the document with the specified fields
        return updateDoc(userDocRef, fieldsToUpdate)
            .then(() => {
                console.log("Document successfully updated in Users collection!");
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
            });

        /*
        //Example usage:
        const userId = "user123"; // Replace with the actual user ID
        const fieldsToUpdate = {
            UserName: "NewUsername",
            LastActionTimestamp: Timestamp.now(),
            ProfilePhotoUrl: "newPhotoUrl"
        };

        updateUserDocument(userId, fieldsToUpdate);
        */
    }

    // Function to generate a random username with shuffled adjectives and nouns
    function GenerateRandomUsername() {
        // List of adjectives and nouns for usernames
        const adjectives = ["big", "angry", "wise", "happy", "adventurous", "playful", "sweet"];
        const nouns = ["banana", "dog", "elephant", "orange", "apple", "watermelon", "strawberry"];

        // Select one adjective and one noun randomly
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

        // Combine adjective and noun to form the username
        return `${randomNoun} the ${randomAdjective}`;
    }

    // Function to add a contact to the Contacts array and remove it from BlockedContacts
    function AddToContactsAndRemoveFromBlockedContacts(userId, contactId) {
        const userDocRef = doc(collection(db,"Users"), userId);

        return runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);

            // Get current arrays
            const contacts = userDoc.data().Contacts || [];
            const blockedContacts = userDoc.data().BlockedContacts || [];

            // Check if the contact is not already in Contacts
            if (!contacts.includes(contactId)) {
                // Remove contactId from BlockedContacts and add it to Contacts
                const updatedBlockedContacts = blockedContacts.filter(id => id !== contactId);
                const updatedContacts = [...contacts, contactId];

                // Update the arrays in the document
                transaction.update(userDocRef, {
                    Contacts: updatedContacts,
                    BlockedContacts: updatedBlockedContacts
                });
            }
        })
            .then(() => {
                console.log("Contact added to Contacts and removed from BlockedContacts!");
            })
            .catch((error) => {
                console.error("Error updating contacts arrays: ", error);
            });
    }

    // Function to add a contact to the BlockedContacts array and remove it from Contacts
    function AddToBlockedContactsAndRemoveFromContacts(userId, contactId) {
        const userDocRef = doc(collection(db,"Users"), userId);

        return runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);

            // Get current arrays
            const contacts = userDoc.data().Contacts || [];
            const blockedContacts = userDoc.data().BlockedContacts || [];

            // Check if the contact is not already in BlockedContacts
            if (!blockedContacts.includes(contactId)) {
                // Remove contactId from Contacts and add it to BlockedContacts
                const updatedContacts = contacts.filter(id => id !== contactId);
                const updatedBlockedContacts = [...blockedContacts, contactId];

                // Update the arrays in the document
                transaction.update(userDocRef, {
                    Contacts: updatedContacts,
                    BlockedContacts: updatedBlockedContacts
                });
            }
        })
            .then(() => {
                console.log("Contact added to BlockedContacts and removed from Contacts!");
            })
            .catch((error) => {
                console.error("Error updating contacts arrays: ", error);
            });
    }

    // Function to add a discussion to the Discussions array and remove it from ArchivedDiscussions
    function AddToDiscussionsAndRemoveFromArchived(userId, discussionId) {
        const userDocRef = doc(collection(db,"Users"), userId);

        return runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);

            // Get current arrays
            const discussions = userDoc.data().Discussions || [];
            const archivedDiscussions = userDoc.data().ArchivedDiscussions || [];

            // Check if the discussion is not already in Discussions
            if (!discussions.includes(discussionId)) {
                // Remove discussionId from ArchivedDiscussions and add it to Discussions
                const updatedArchivedDiscussions = archivedDiscussions.filter(id => id !== discussionId);
                const updatedDiscussions = [...discussions, discussionId];

                // Update the arrays in the document
                transaction.update(userDocRef, {
                    Discussions: updatedDiscussions,
                    ArchivedDiscussions: updatedArchivedDiscussions
                });
            }
        })
            .then(() => {
                console.log("Discussion added to Discussions and removed from ArchivedDiscussions!");
            })
            .catch((error) => {
                console.error("Error updating discussions arrays: ", error);
            });
    }

    // Function to add a discussion to the ArchivedDiscussions array and remove it from Discussions
    function AddToArchivedAndRemoveFromDiscussions(userId, discussionId) {
        const userDocRef = doc(collection(db,"Users"), userId);

        return runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);

            // Get current arrays
            const discussions = userDoc.data().Discussions || [];
            const archivedDiscussions = userDoc.data().ArchivedDiscussions || [];

            // Check if the discussion is not already in ArchivedDiscussions
            if (!archivedDiscussions.includes(discussionId)) {
                // Remove discussionId from Discussions and add it to ArchivedDiscussions
                const updatedDiscussions = discussions.filter(id => id !== discussionId);
                const updatedArchivedDiscussions = [...archivedDiscussions, discussionId];

                // Update the arrays in the document
                transaction.update(userDocRef, {
                    Discussions: updatedDiscussions,
                    ArchivedDiscussions: updatedArchivedDiscussions
                });
            }
        })
            .then(() => {
                console.log("Discussion added to ArchivedDiscussions and removed from Discussions!");
            })
            .catch((error) => {
                console.error("Error updating discussions arrays: ", error);
            });
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
});