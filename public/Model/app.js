// Your web app's Firebase configuration
import {initializeApp} from "./Firebase/firebase-app.js";
import {
    createUserWithEmailAndPassword,
    getAuth, GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "./Firebase/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    getFirestore, runTransaction,
    Timestamp,
    updateDoc
} from "./Firebase/firebase-firestore.js";
import {getStorage} from "./Firebase/firebase-storage.js";

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

let currentUser;
let currentGroupID;
let currentGroupListener; // Store reference to the current group listener

document.addEventListener('DOMContentLoaded', function () {
    // Check Auth state and change "logged" value
    onAuthStateChanged(auth, function (user) {
        if (user) {
            localStorage.setItem('logged', "true"); // Store the value in local storage
            currentUser = user;
            console.log("user logged in", user);
        } else {
            localStorage.setItem('logged', "false"); // Store the value in local storage
            currentUser = "";
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
                DisplayDiscussions();//Fetch groups and display the group names
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

    function DisplayDiscussions() {
        // Reference to the "Discussions" collection
        const UserdiscussionsRef = doc(db, "Discussions");

        // Iterate over each document in the "Discussions" collection
        discussionsRef.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const discussionName = doc.data().Name;

                // Create the HTML elements
                const anchor = document.createElement("a");
                const div1 = document.createElement("div");
                const img = document.createElement("img");
                const span = document.createElement("span");
                const div2 = document.createElement("div");
                const heading = document.createElement("h3");
                const paragraph = document.createElement("p");

                // Set attributes and classes
                anchor.setAttribute("href", "#");
                anchor.classList.add("d-flex", "align-items-center");
                div1.classList.add("flex-shrink-0");
                img.classList.add("img-fluid");
                img.setAttribute("src", "https://mehedihtml.com/chatbox/assets/img/user.png");
                img.setAttribute("alt", "user img");
                span.classList.add("active");
                div2.classList.add("flex-grow-1", "ms-3");

                // Set inner HTML
                heading.textContent = discussionName;

                // Reference to the "Messages" sub-collection for the current discussion
                let discussionRef = discussionsRef.doc(doc.id);
                const messagesRef = discussionRef.collection("Messages");

                // Query to get the last message, ordered by timestamp
                messagesRef.orderBy("Timestamp", "desc").limit(1).get().then((messageQuerySnapshot) => {
                    messageQuerySnapshot.forEach((messageDoc) => {
                        const lastMessage = messageDoc.data().message; // Assuming your message field is named "message"

                        // Populate the paragraph with the last message
                        paragraph.textContent = "Last Message: " + lastMessage;

                        // Append the child elements to their parent elements
                        div1.appendChild(img);
                        div1.appendChild(span);
                        div2.appendChild(heading);
                        div2.appendChild(paragraph);
                        anchor.appendChild(div1);
                        anchor.appendChild(div2);

                        // Append the main element into the <div class="chat-list">
                        const chatListDiv = document.querySelector(".chat-list");
                        chatListDiv.appendChild(anchor);
                    });
                }).catch((error) => {
                    console.log("Error getting last message:", error);
                });
            });
        }).catch((error) => {
            console.log("Error getting discussions:", error);
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
            .catch((error) => {// An error happened.
                console.error(error);
            })
    }

    /**
     * Function to log in with email and password
     */
    function Login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(email, password)
            .then((result) => {
                console.log("Logged in : " + result.user.displayName)
                window.location.href = '#home';
            })
            .catch((error) => {
                console.error(error);
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
                window.location = '#home';
            })
            .catch((error) => {// Handle Errors here.
                console.error(error);
            })
    }

    // Function to create a document in the "Users" collection
    function CreateUserDocument(user, userName) {
        // Reference to the "Users" collection
        const usersCollection = collection("Users");

        // Create a new document with the user's ID
        usersCollection.doc(user.id).set({
            Discussions: [],
            ArchivedDiscussions: [],
            Contacts: [],
            BlockedContacts: [],
            CreationTimestamp: Timestamp.now(),
            LastActionTimestamp: Timestamp.now(),
            ProfilePhotoUrl: user.photoURL || "https://firebasestorage.googleapis.com/v0/b/webchat-tpi.appspot.com/o/ProfilePhotos%2FDefaultProfilePhoto1.jpg?alt=media&token=3eb0960d-24c1-4fd7-9278-8416e1913a23",
            UserName: userName || GenerateRandomUsername()
        })
            .then(() => {
                console.log("Document successfully created in Users collection!");
            })
            .catch((error) => {
                console.error("Error creating document: ", error);
            });
    }

    // Function to update a document in the "Users" collection
    function UpdateUserDocument(userId, fieldsToUpdate) {
        // Reference to the "Users" collection
        const usersCollection = collection("Users");

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
        const userDocRef = doc(collection("Users"), userId);

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
        const userDocRef = doc(collection("Users"), userId);

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
        const userDocRef = doc(collection("Users"), userId);

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
        const userDocRef = doc(collection("Users"), userId);

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