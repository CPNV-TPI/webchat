/*
* Name : firestore.js
* Author : JSO
* Modified : 23.05.2024
* */

import {
    collection,
    doc,
    getDoc,
    getFirestore,
    orderBy,
    query,
    runTransaction,
    setDoc,
    Timestamp,
    updateDoc,
    collectionGroup,
    where,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {currentUser} from "./auth.js";
import {app} from "./initializeFirebase.js";

const db = getFirestore(app);// Initialize Cloud Firestore and get a reference to the service

// Fetch discussions from Firestore
async function FetchDiscussions() {
    try {
        // Get the current user's discussions
        const userId = currentUser.uid;
        const userRef = doc(db, 'Users', userId);

        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const discussions = userDoc.data().Discussions;
            const promises = discussions.map(discussionId => {
                return getDoc(doc(db, 'Discussions', discussionId));
            });
            const snapshots = await Promise.all(promises);
            return snapshots.map(doc => ({ id: doc.id, data: doc.data() }));
        } else {
            console.error('User document not found');
            return [];
        }
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Fetch messages of a specific discussion from Firestore
async function FetchMessages(discussionId) {
    try {
        // Create a reference to the messages collection under the specified group document
        const messagesRef = collection(db, "Discussions", discussionId, "Messages");

        // Create a query to order messages by timestamp in ascending order
        const q = query(messagesRef, orderBy("Timestamp", "asc"));

        // Fetch the messages
        const querySnapshot = await getDocs(q);

        // Map over the documents and return the array of message objects
        return querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

// Function to create a document in the "Users" collection
async function CreateUserProfileDocument(user, userName) {
    // Ensure the user object has an uid property
    if (!user || !user.uid) {
        console.error("Invalid user object:", user);
        return;
    }
    // Check if the user document exists in Firestore
    const userDocRef = doc(db, "Users", user.uid); // Create a document reference with user's ID
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        console.error("User already have profile document:", user);
        return;
    }

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
            AddToArray(user.uid, "Discussions", "VTlG5Gv8X5JLTO8MLjyb");
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

function AddToArray(userId, arrayName, itemId) {
    const userDocRef = doc(collection(db, "Users"), userId);

    return runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);

        // Get current array
        const currentArray = userDoc.data()[arrayName] || [];

        // Check if the item is not already in the array
        if (!currentArray.includes(itemId)) {
            // Add itemId to the array
            const updatedArray = [...currentArray, itemId];

            // Update the array in the document
            transaction.update(userDocRef, {
                [arrayName]: updatedArray
            });
        }
    })
        .then(() => {
            console.log(`${itemId} added to ${arrayName}!`);
        })
        .catch((error) => {
            console.error(`Error adding ${itemId} to ${arrayName}: `, error);
        });
}

function RemoveFromArray(userId, arrayName, itemId) {
    const userDocRef = doc(collection(db, "Users"), userId);

    return runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);

        // Get current array
        const currentArray = userDoc.data()[arrayName] || [];

        // Check if the item is in the array
        if (currentArray.includes(itemId)) {
            // Remove itemId from the array
            const updatedArray = currentArray.filter(id => id !== itemId);

            // Update the array in the document
            transaction.update(userDocRef, {
                [arrayName]: updatedArray
            });
        }
    })
        .then(() => {
            console.log(`${itemId} removed from ${arrayName}!`);
        })
        .catch((error) => {
            console.error(`Error removing ${itemId} from ${arrayName}: `, error);
        });
}

/*
Usage Examples

Adding to Contacts
addToArray(userId, "Contacts", contactId);

Removing from Contacts
removeFromArray(userId, "Contacts", contactId);

Adding to BlockedContacts
addToArray(userId, "BlockedContacts", contactId);

Removing from BlockedContacts
removeFromArray(userId, "BlockedContacts", contactId);

Adding to Discussions
addToArray(userId, "Discussions", discussionId);

Removing from Discussions
removeFromArray(userId, "Discussions", discussionId);

Adding to ArchivedDiscussions
addToArray(userId, "ArchivedDiscussions", discussionId);

Removing from ArchivedDiscussions
removeFromArray(userId, "ArchivedDiscussions", discussionId);
 */

export { AddToArray, RemoveFromArray, FetchDiscussions, FetchMessages, CreateUserProfileDocument}