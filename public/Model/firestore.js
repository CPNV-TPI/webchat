/*
* Name : firestore.js
* Author : JSO
* Modified : 23.05.2024
* */
import {app} from "./initializeFirebase.js";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { DisplayMessages } from "./app.js";

const db = getFirestore(app);// Initialize Cloud Firestore and get a reference to the service

// Fetch discussions of a user from Firestore with real-time updates
function FetchDiscussions(currentUserUid, discussionType, callback) {
    try {
        let fieldName = 'discussions';
        if (discussionType === 'Archived') {
            fieldName = 'archivedDiscussions';
        }

        ListenToDocField('Users', currentUserUid, fieldName, async (userDiscussions) => {
            if (userDiscussions) {
                const discussionsData = [];

                for (const discussionId of userDiscussions) {

                    const discussionRef = doc(db, 'Discussions', discussionId);
                    const discussionDoc = await getDoc(discussionRef);

                    if (discussionDoc.exists()) {
                        const discussionData = discussionDoc.data();

                        const messagesData = await FetchMessages(discussionId, currentUserUid, false);
                        console.log('Messages:', messagesData);
                        const unreadMessages = messagesData.filter(message => !message.data.readBy.includes(currentUserUid));
                        const unreadCount = unreadMessages.length;

                        const discussionInfo = {
                            id: discussionId,
                            data: discussionData,
                            unreadCount: unreadCount
                        };

                        const existingIndex = discussionsData.findIndex(d => d.id === discussionId);
                        if (existingIndex >= 0) {
                            discussionsData[existingIndex] = discussionInfo;
                        } else {
                            discussionsData.push(discussionInfo);
                        }
                    }
                }
                callback(discussionsData);
            } else {
                console.error('User discussions not found');
                callback([]);
            }
        });
    } catch (error) {
        console.error(error);
        callback([]);
    }
}

// Fetch messages of a specific discussion from Firestore
//async function FetchMessages(discussionId, userId) {
//    try {
//        // Fetch messages from Firestore
//        const messagesRef = collection(db, "Discussions", discussionId, "Messages");
//        const q = query(messagesRef, orderBy("Timestamp", "asc"));
//
//        const querySnapshot = await getDocs(q); // Fetch messages synchronously
//
//        const batch = writeBatch(db);
//        querySnapshot.forEach((document) => {
//            const messageData = document.data();
//            if (Array.isArray(messageData.readBy) && !messageData.readBy.includes(userId)) {
//                const messageRef = doc(db, "Discussions", discussionId, "Messages", document.id);
//                batch.update(messageRef, {readBy: arrayUnion(userId)});
//            }
//        });
//        await batch.commit(); // Commit the batch update
//
//        // Return the array of message data
//        return querySnapshot.docs.map(doc => ({id: doc.id, data: doc.data()}));
//    } catch (error) {
//        console.error('Error fetching messages:', error);
//        throw error;
//    }
//}

// Fetch messages of a specific discussion from Firestore in real-time
async function FetchMessages(discussionId, userId, display = true) {
    try {
        // Listen to messages from Firestore
        const messagesRef = collection(db, "Discussions", discussionId, "Messages");
        const q = query(messagesRef, orderBy("Timestamp", "asc"));

        if (display) {
            // Real-time listener for the messages
            return onSnapshot(q, async (querySnapshot) => {
                const batch = writeBatch(db);
                const messages = querySnapshot.docs.map(document => {
                    if (Array.isArray(document.data().readBy) && !document.data().readBy.includes(userId)) {
                        const messageRef = doc(db, "Discussions", discussionId, "Messages", document.id);
                        batch.update(messageRef, {readBy: arrayUnion(userId)});
                    }
                    return {id: document.id, data: document.data()};
                });
                await batch.commit(); // Commit the batch update
                await DisplayMessages(messages);
            });
        } else {
            // Fetch messages from Firestore
            const messagesRef = collection(db, "Discussions", discussionId, "Messages");
            const q = query(messagesRef, orderBy("Timestamp", "asc"));

            const querySnapshot = await getDocs(q); // Fetch messages synchronously

            const batch = writeBatch(db);
            querySnapshot.forEach((document) => {
                const messageData = document.data();
                if (Array.isArray(messageData.readBy) && !messageData.readBy.includes(userId)) {
                    const messageRef = doc(db, "Discussions", discussionId, "Messages", document.id);
                    batch.update(messageRef, {readBy: arrayUnion(userId)});
                }
            });
            await batch.commit(); // Commit the batch update

            // Return the array of message data
            return querySnapshot.docs.map(doc => ({id: doc.id, data: doc.data()}));
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
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

    // Generate a random available username
    const randomUserName = await GenerateAvailableUsername();

    // Create a new document with the user's ID
    setDoc(userDocRef, {
        discussions: [],
        archivedDiscussions: [],
        contacts: [],
        blockedContacts: [],
        creationTimestamp: serverTimestamp(),
        lastReadTimestamps: [],
        profilePhotoUrl: "https://firebasestorage.googleapis.com/v0/b/webchat-tpi.appspot.com/o/ProfilePhotos%2FDefaultProfilePhoto1.jpg?alt=media&token=3eb0960d-24c1-4fd7-9278-8416e1913a23",
        userName: userName || randomUserName,
        email: user.email,
    })
        .then(() => {
            console.log("Document successfully created in Users collection!");
            AddToArray("Users", user.uid, "discussions", "VTlG5Gv8X5JLTO8MLjyb");
            AddToArray("Users", user.uid, "archivedDiscussions", "gRBtz9y97wHmHNc8Z6Uq");
            AddToArray( "Discussions", "VTlG5Gv8X5JLTO8MLjyb", "members", user.uid );
            AddToArray( "Discussions", "gRBtz9y97wHmHNc8Z6Uq", "members", user.uid );
        })
        .catch((error) => {
            console.error("Error creating document: ", error);
        });
}

// Function to update a document in the "Users" collection
function UpdateUserProfileDocument(userId, fieldsToUpdate) {
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


// function to check if the gived pseudo is disponible
async function CheckUsernameAvailability(username) {
    const q = query(collection(db, "Users"), where("UserName", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

// Function to generate a random username with shuffled adjectives and nouns
function GenerateRandomUsername() {
    // Expanded list of adjectives and nouns for usernames
    const adjectives = [
        "big", "angry", "wise", "happy", "adventurous", "playful", "sweet", "brave", "clever",
        "curious", "eager", "friendly", "funny", "gentle", "graceful", "grumpy", "helpful",
        "jolly", "kind", "lively", "mighty", "noble", "proud", "quick", "quiet", "silly",
        "smart", "strong", "thoughtful", "witty", "zany", "bouncy", "daring", "mischievous",
        "sleepy", "bright", "charming", "cheerful", "diligent", "fearless", "fierce",
        "gleeful", "gracious", "honest", "joyful", "loyal", "nimble", "plucky", "polite",
        "radiant", "spirited", "stealthy", "tenacious", "valiant", "vibrant", "zesty"
    ];

    const nouns = [
        "banana", "dog", "elephant", "orange", "apple", "watermelon", "strawberry", "tiger",
        "lion", "bear", "eagle", "fox", "giraffe", "hippo", "kangaroo", "koala", "leopard",
        "monkey", "panda", "parrot", "peacock", "penguin", "rabbit", "rhino", "seal", "shark",
        "whale", "zebra", "alligator", "antelope", "bat", "beaver", "buffalo", "camel", "cheetah",
        "chimpanzee", "coyote", "crocodile", "dolphin", "flamingo", "goose", "hamster", "hawk",
        "hedgehog", "jaguar", "llama", "lobster", "meerkat", "moose", "narwhal", "ostrich",
        "otter", "owl", "puma", "raccoon", "reindeer", "swan", "toucan", "turtle", "walrus",
        "wolf", "woodpecker"
    ];

    // Select one adjective and one noun randomly
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    // Generate a random three-digit number
    const randomThreeDigitNumber = Math.floor(Math.random() * 900) + 100; // 100 to 999

    // Combine adjective and noun to form the username
    return `${randomNoun} the ${randomAdjective}_${randomThreeDigitNumber}`;
}

// Function to generate a random username that is available
async function GenerateAvailableUsername() {
    let username;
    let isAvailable = false;

    while (!isAvailable) {
        username = GenerateRandomUsername();
        isAvailable = await CheckUsernameAvailability(username);
    }

    return username;
}

// function to create a discussion
function CreateDiscussion(name, userId, members) {
    // Create a new document
    const newDoc = doc(collection(db, "Discussions"));
    setDoc(newDoc, {
        lastMessageTimestamp: serverTimestamp,
        name: name,
        members: [],
    })
        .then(() => {
            const newMessageDocRef = doc(collection(db, "Discussions", newDoc.id, "Messages"));
            setDoc(newMessageDocRef, {
                auth: userId,
                text: "Welcome to " + name,
                timestamp: serverTimestamp,
            })
                .then(() => {
                    console.log("Message Document successfully created!");
                })
                .catch((error) => {
                    console.error("Error creating message document: ", error);
                });


            for (let i = 0; i < members.length; i++) {
                // add the discussion id in the members user document
                AddToArray("Users" ,members[i], "discussions", newDoc.id);
                // add members in the new discussion document
                AddToArray( "Discussions", newDoc.id, "members", members[i]);
            }
        })
        .catch((error) => {
            console.error("Error creating document: ", error);
        });
}



// Fetch email, username, and doc.id of all users
async function FetchSomeUserDetails() {
    try {
        const usersRef = collection(db, "Users");
        const querySnapshot = await getDocs(usersRef);
        let allUsers = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allUsers.push({ uid: doc.id, userName: data.userName, email: data.email });
        });
        return allUsers;
    } catch (error) {
        console.error("Error fetching user details: ", error);
    }
}

/*function AddToArray(userId, arrayName, itemId) {
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
}*/

// Function to add an item to an array
async function AddToArray(collectionName, documentId, arrayName, itemId) {
    const docRef = doc(collection(db, collectionName), documentId);

    try {
        await updateDoc(docRef, {
            [arrayName]: arrayUnion(itemId)
        });
        console.log(`${itemId} added to ${arrayName}!`);
    } catch (error) {
        console.error(`Error adding ${itemId} to ${arrayName}: `, error);
    }
}

// Function to remove an item from an array
async function RemoveFromArray(collectionName, documentId, arrayName, itemId) {
    const docRef = doc(collection(db, collectionName), documentId);

    try {
        await updateDoc(docRef, {
            [arrayName]: arrayRemove(itemId)
        });
        console.log(`${itemId} removed from ${arrayName}!`);
    } catch (error) {
        console.error(`Error removing ${itemId} from ${arrayName}: `, error);
    }
}

function ListenToDocField(collectionName, documentId, fieldName, callback) {
    const userDocRef = doc(collection(db, collectionName), documentId);

    try {
        onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const fieldValue = userDoc.data()[fieldName];

                // Return the field value as is
                console.log(`${fieldName}:`, fieldValue);
                callback(fieldValue);

                // Parse contacts array
                //const parsedContacts = fieldValue.map(contact => {
                //    const [id, userName, email] = contact.split(",");
                //    return { id, userName, email };
                //});
            } else {
                console.log("No such document!");
                callback(null);
            }
        }, (error) => {
            console.error(`Error reading ${fieldName} from user document: `, error);
            callback(null, error);
        });
    } catch (error) {
        console.error(`Error setting up listener for ${fieldName}: `, error);
        callback(null, error);
    }
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

export { AddToArray, RemoveFromArray, ListenToDocField, FetchDiscussions, FetchMessages, CreateUserProfileDocument, FetchSomeUserDetails, CreateDiscussion}