/*
* Name : app.js
* Author : JSO
* Modified : 23.05.2024
* */

// import functions and variables
import {auth, onAuthStateChanged, GoogleLogin, Login, Logout, Register} from "./auth.js";
import {
    FetchDiscussions,
    FetchMessages,
    FetchSomeUserDetails,
    AddToArray,
    // RemoveFromArray,
    ListenToDocField,
    CreateDiscussion
} from "./firestore.js";

//let currentDiscussionListener;
let logged;
let currentUser;
let page;

let selectedUsers = []; // Array to store selected users as objects with id and userName

// Define the custom event
const loggedChangeEvent = new Event('loggedChange');
const pageChangeEvent = new Event('pageChange');

// Dispatch the event whenever the value of logged changes
// For example, if you have a function that updates the login status, you can dispatch the event after the update
function UpdateLoginStatus(newStatus) {
    logged = newStatus;
    // Dispatch the custom event
    window.dispatchEvent(loggedChangeEvent);
}

// Dispatch the event whenever the value of page changes
// For example, if you have a function that updates the page, you can dispatch the event after the update
function UpdatePage(newPage) {
    page = newPage;
    // Dispatch the custom event
    window.dispatchEvent(pageChangeEvent);
}

// display the correct page
function DisplayPage() {
    // If 'page' is not present, redirect to '?page=discussionsOpen'
    if (!page) {
        page = 'discussionsOpen'; // Set the default value to 'discussionsOpen'
    }

    // Check the value of the 'page' and display the corresponding page
    switch (page) {
        case "discussionsOpen":
            // Display open discussions
            DisplayDiscussions('Open')
                .then(
                    () => {
                        // Scroll to the top of the page
                        window.scrollTo({top: 0});
                    }
                )
            break;
        case "discussionsArchived":
            // Display archived discussions
            DisplayDiscussions('Archived')
                .then(
                    () => {
                        // Scroll to the top of the page
                        window.scrollTo({top: 0});
                    }
                )
            break;
        case "profile":
            // Display profile settings
            //DisplayProfileSettings()
            //    .then(
            //        () => {
            //            // Scroll to the top of the page
            //            window.scrollTo({top: 0});
            //        }
            //    )
            break;
        default:
            console.log("page is not recognized or not provided."); // Handle other cases
            break;
    }
}

/**
 * Validates the register form by checking if all fields are filled and if the username is at least 4 characters long.
 * @returns {boolean} - Returns true if the form is valid, false otherwise.
 */
function validateRegisterForm() {
    // Get the register form element
    let form = document.getElementById('register_form');

    // Access form fields by their names
    const nameField = form.elements['register-username'];
    const emailField = form.elements['register-email'];
    const passwordField = form.elements['register-password'];

    // Perform validation
    if (!nameField.value.trim() || !emailField.value.trim() || !passwordField.value.trim()) {
        // If any of the fields are empty, show an alert and return false
        alert('Please fill in all fields.');
        return false;
    } else if (nameField.value.length < 4) {
        // If the username is less than 4 characters, show an alert and return false
        alert('The username field is too short. (min 4 characters)');
        return false;
    }

    // If all fields are valid, return true
    return true;
}

/**
 * This function validates the login form by checking if the email and password fields are filled.
 * @returns {boolean} - Returns true if the form is valid, false otherwise.
 */
function validateLoginForm() {
    // Get the login form element
    let form = document.getElementById('login_form');

    // Access form fields by their names
    const emailField = form.elements['login-email'];
    const passwordField = form.elements['login-password'];

    // Perform validation
    // Check if email and password fields are filled
    if (!emailField.value.trim() || !passwordField.value.trim()) {
        // If either field is empty, show an alert and return false
        alert('Please fill in all fields.');
        return false; // Return false to indicate validation failure
    }

    // Add more validation logic as needed
    // For example, you might want to check if the email is in a valid format

    return true; // Return true to indicate validation success
}

function CreateDiscussions() {
    CreateDiscussion("Test Discussion", currentUser.uid, [currentUser.uid, "testuser2"], "test content")
}

// Display users matching the email input
async function DisplayMatchingUserByEmail(input) {
    const allUsers = await FetchSomeUserDetails();
    let message;
    const filteredUsers = allUsers.filter(user => user.email.toLowerCase() === input.toLowerCase());

    if (input.length === 0) {
        message = "Please enter an email.";
    }
    if (!message && filteredUsers.length === 0) {
        message = "No matching contacts found.";
    }

    const matchingUsernamesDiv = document.getElementById('matching_usernames');
    matchingUsernamesDiv.innerHTML = ''; // Clear previous results
    const form = document.createElement('form');
    form.id = 'matching_usernames_form';

    if (message) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        matchingUsernamesDiv.appendChild(messageDiv);
    } else {
        // Display matching users
        filteredUsers.forEach(user => {
            const checkbox = CreateCheckbox(selectedUsers.some(selectedUser => selectedUser.uid === user.uid), user);
            form.appendChild(checkbox);
            form.appendChild(document.createElement('br'));
        });
    }

    if (selectedUsers.length > 0) {
        form.appendChild(document.createElement('hr')); // add a separator

        // Display already selected users
        selectedUsers.forEach(user => {
            const checkbox = CreateCheckbox(true, user);
            form.appendChild(checkbox);
            form.appendChild(document.createElement('br'));
        });
    }

    matchingUsernamesDiv.appendChild(form);
}

// Create a checkbox for user selection
function CreateCheckbox(checked, user) {
    const checkboxLabel = document.createElement('label');
    checkboxLabel.classList.add('username-checkbox-label');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'usernames';
    checkbox.value = user.uid;
    checkbox.dataset.username = user.userName; // Store the username in a data attribute

    checkbox.checked = checked;

    checkbox.addEventListener('change', handleCheckboxChange);
    checkboxLabel.appendChild(checkbox);

    const span = document.createElement('span');
    span.textContent = `${user.userName} (${user.email})`;
    checkboxLabel.appendChild(span);

    return checkboxLabel;
}

// Handle checkbox changes
async function handleCheckboxChange(event) {
    const checkbox = event.target;
    const userId = checkbox.value;
    const userName = checkbox.dataset.username;

    if (checkbox.checked) {
        selectedUsers.push({ uid: userId, userName: userName });
    } else {
        selectedUsers = selectedUsers.filter(user => user.uid !== userId);
    }
    // Re-render to reflect changes
    const input = document.getElementById('contact_email').value;
    await DisplayMatchingUserByEmail(input);
}

function AddContact(users) {
    users.forEach(user => {
        AddToArray("Users", currentUser.uid, "contacts", user.uid + "," + user.userName + "," + user.email)
            .then(() => {
                console.log("Contacts added successfully!");
                ClearSelectedUsers();
            })
            .catch(error => {
                console.error("Error adding contacts: ", error);
            });
    })

    ClearSelectedUsers();
}

function ClearSelectedUsers() {
    // Clear the selectedUserIds array
    selectedUsers = [];

    // Get all checkboxes and uncheck them
    const checkboxes = document.querySelectorAll('input[name="usernames"]:checked');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    console.log("Selected user IDs have been cleared.");
}

async function DisplayProfileSettings() {
    const profileSettings = await FetchProfileSettings(currentUser);

    const profileSettingsDiv = document.getElementById('profile_settings');
    profileSettingsDiv.innerHTML = ''; // Clear previous content

    profileSettingsDiv.appendChild(profileSettings);

    console.info("DisplayProfileSettings()");
}

let currentDiscussionListener;

// Display discussions
async function DisplayDiscussions(containerId) {
    try {
        const discussions = await new Promise((resolve, reject) => {
            FetchDiscussions(currentUser.uid, containerId,(discussions) => {
                resolve(discussions);
            });
        });

        console.log("test:" + discussions);

        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear previous content

        discussions.forEach(discussion => {
            const discussionDiv = document.createElement('div');
            discussionDiv.classList.add('chat-list');

            const discussionLink = document.createElement('a');
            discussionLink.classList.add('d-flex', 'align-items-center');
            discussionLink.role = 'button';
            discussionLink.addEventListener('click', async () => { // Add click event listener to load messages for the clicked discussion
                if (currentDiscussionListener) {
                    // Unsubscribe from the previous listener
                    currentDiscussionListener();
                }
                currentDiscussionListener = FetchMessages(discussion.id, currentUser.uid); // Set the new listener
            });

            const discussionImg = document.createElement('img');
            discussionImg.classList.add('img-fluid');
            discussionImg.src = 'https://mehedihtml.com/chatbox/assets/img/user.png';
            discussionImg.alt = 'discussion img';

            const activeDive = document.createElement('div');
            // add the active div only if the user haven't seen the last message
            if (discussion.unreadCount > 0) {
                activeDive.classList.add('active');
            }

            const discussionDetails = document.createElement('div');
            discussionDetails.classList.add('flex-grow-1', 'ms-3');

            const discussionName = document.createElement('h3');
            discussionName.textContent = discussion.data.name;
            const lastAction = document.createElement('p');
            lastAction.textContent = "";
            //`Last action: ${discussion.data.LastActionTimestamp.toDate().toLocaleString()}`;

            discussionDetails.appendChild(discussionName);
            discussionDetails.appendChild(lastAction);

            discussionLink.appendChild(discussionImg);
            discussionLink.appendChild(activeDive);

            discussionLink.appendChild(discussionDetails)
            discussionDiv.appendChild(discussionLink);
            container.appendChild(discussionDiv);
        });
    } catch (error) {
        console.error('Error displaying discussions:', error);
    }
}

// Display messages of a discussion
async function DisplayMessages(messages) {
    console.log(messages);

    const msgBody = document.querySelector('.msg-body ul');
    msgBody.innerHTML = ''; // Clear previous messages

    let LastMessageDay = null;
    messages.forEach(message => {
        const messageData = message.data;

        const messageDate = new Date(messageData.timestamp); // Convert timestamp to Date object
        const messageDay = messageDate.getDay(); // Get day as a string

        console.log(messageData.timestamp);
        console.log(new Date(messageData.timestamp));
        console.log(new Date(messageData.timestamp * 1000));
        console.log(new Date(messageData.timestamp * 1000).toLocaleString());
        console.log(new Date(messageData.timestamp * 1000).toLocaleDateString());
        console.log(new Date(messageData.timestamp * 1000).toLocaleTimeString());

        console.log(messageDate + "|" + messageDay);

        // Display date divider if it's a new date
        if (messageDay !== LastMessageDay) {
            const divider = document.createElement('li');
            divider.classList.add('divider');
            divider.innerHTML = `<h6>${messageDay}</h6>`;
            msgBody.appendChild(divider);
            LastMessageDay = messageDay;
        }

        // Create message element
        const messageLi = document.createElement('li');
        messageLi.classList.add(messageData.auth === currentUser.uid ? 'sender' : 'other');
        messageLi.innerHTML = `<p>${messageData.text}</p><span class="time">${messageDate.toLocaleTimeString()}</span>`;
        msgBody.appendChild(messageLi);
    });
}

document.addEventListener('DOMContentLoaded', function () {

    // Check Auth state and change "logged" value
    onAuthStateChanged(auth, function (user) {
        if (user) {
            currentUser = user;
            UpdateLoginStatus(true)
            console.log("user logged in");
            UpdatePage('discussionsOpen');
        } else {
            currentUser = "";
            UpdateLoginStatus(false)
            console.log("user logged out");
        }
    });

    // Add an event listener to listen for the 'pageChange' event
    window.addEventListener('pageChange', () => {
        DisplayPage();
        console.log('Page changed');
    });

    /**
     * Add listener to all click event and call the correct function by checking the target id
     */
    document.addEventListener('click', async function (event) {
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
                case 'search_contact_button':
                    const input = document.getElementById('contact_email').value;
                    await DisplayMatchingUserByEmail(input);
                    break;
                case 'add_contact_btn':
                    if (selectedUsers.length > 0) {
                        AddContact(selectedUsers);
                    }
                    break;
                case 'block_contact_btn':

                    break;
                case 'create_discussion_btn':
                    CreateDiscussions();
                    break;
                case 'discussions_btn':
                case 'Open-tab':
                    UpdatePage('discussionsOpen');
                    break;
                case 'Archived-tab':
                    UpdatePage('discussionsArchived');
                    break;
                case 'profile_btn':
                    UpdatePage('profile');
                    break;
                default:
                    break;
            }
        }
    });

    document.addEventListener('input', async function (event) {
        // Check if the element has an id
        if (event.target && event.target.id) {
            const targetId = event.target.id;
            const inputValue = event.target.value;
            switch (targetId) {
                case 'inlineFormInputGroup':
                    break;
                default:
                    break;
            }
        }
    });
});

// Export functions
export {currentUser, logged, DisplayMessages};


