/*
* Name : app.js
* Author : JSO
* Modified : 23.05.2024
* */

// import functions and variables
import { auth, onAuthStateChanged, GoogleLogin, Login, Logout, Register} from "./auth.js";
import {FetchDiscussions, FetchMessages, RemoveFromArray, AddToArray, FetchUsernames} from "./firestore.js";

let currentDiscussionID;
let currentDiscussionListener; // Store reference to the current Discussion listener
let logged;
let currentUser;

let selectedUserIds = []; // Array to store selected users with their IDs and usernames
let selectedUsernames = [];

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

document.addEventListener('DOMContentLoaded', function () {

    function checkActionAndUpdate() {
        if (!logged) {
            console.log("User is not logged in.");
            return; // Exit the function if the user is not logged in
        }else{
            console.log("User is logged in.");
        }

        // Get the value of the 'page' and 'action' query parameters from the URL
        const urlParams = new URLSearchParams(window.location.search);
        let page = urlParams.get('page');

        // If 'page' is not present, redirect to '?page=discussionsOpen'
        if (!page) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('page', 'discussionsOpen');
            window.location.href = newUrl.toString();
        }

        // Check the value of the 'page' parameter and take appropriate action
        switch (page) {
            case "discussionsOpen":
                DisplayDiscussions('Open'); // Display open discussions
                break;
            case "discussionsArchived":
                DisplayDiscussions('Archived'); // Display archived discussions
                break;
            case "profile":
                DisplayProfileSettings(); //Fetch profile settings property and display them
                break;
            default:
                console.log("Page parameter is not recognized or not provided.");
                break;
        }
    }

    // Add event listener for the 'popstate' event
    window.addEventListener('popstate', checkActionAndUpdate);

    // Call the function initially to handle the current URL state
    checkActionAndUpdate();

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
                    if (selectedUserIds.length > 0) {
                        AddContact(selectedUserIds);
                    }
                    break;
                case 'block_contact_btn':

                    break;
                case 'create_discussion_btn':
                    CreateDiscussions()
                        .catch(error => {
                            console.error("Error creating discussion:", error);
                            // Handle error appropriately, e.g., show an error message to the user
                        });
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
            switch (targetId) {
                case 'inlineFormInputGroup':
                    break;
                case 'contact_username':
                    const input = event.target.value;
                    if (input.length < 3) {
                        DisplayMatchingUsernames([], "Please enter at least 3 characters.");
                        return;
                    }
                    DisplayMatchingUsernames(await FetchUsernames(input));
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
        }else if (nameField.value.length < 4) {
            alert('The username field is too short. (min 4 characters)');
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

    function CreateDiscussions(){

    }

    function DisplayMatchingUsernames(users, message) {
        const matchingUsernamesDiv = document.getElementById('matching_usernames');
        matchingUsernamesDiv.innerHTML = ''; // Clear previous results

        if (!message && users.length === 0){
            message = "No matching users found."
        }
        if (message) {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = message;
            matchingUsernamesDiv.appendChild(messageDiv);
        }

        const form = document.createElement('form');
        form.id = 'matching_usernames_form';

        // Display matching users
        users.forEach(user => {
            const checkboxLabel = document.createElement('label');
            checkboxLabel.classList.add('username-checkbox-label');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'usernames';
            checkbox.value = user.id;
            checkbox.checked = selectedUserIds.includes(user.id);
            checkbox.addEventListener('change', handleCheckboxChange);
            checkboxLabel.appendChild(checkbox);

            const span = document.createElement('span');
            span.textContent = user.userName;
            checkboxLabel.appendChild(span);

            form.appendChild(checkboxLabel);
            form.appendChild(document.createElement('br'));
        });

        matchingUsernamesDiv.appendChild(form);

        if (selectedUserIds.length > 0) {
            const separator = document.createElement('hr');
            matchingUsernamesDiv.appendChild(separator);

            const selectedUsersForm = document.createElement('form');
            selectedUsersForm.id = 'selected_usernames_form';

            // Display already selected users
            selectedUserIds.forEach((userId, index) => {
                const checkboxLabel = document.createElement('label');
                checkboxLabel.classList.add('username-checkbox-label');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'usernames';
                checkbox.value = userId;
                checkbox.checked = true;
                checkbox.addEventListener('change', handleCheckboxChange);
                checkboxLabel.appendChild(checkbox);

                const span = document.createElement('span');
                span.textContent = selectedUsernames[index];
                checkboxLabel.appendChild(span);

                selectedUsersForm.appendChild(checkboxLabel);
                selectedUsersForm.appendChild(document.createElement('br'));
            });

            matchingUsernamesDiv.appendChild(selectedUsersForm);
        }
    }

    function handleCheckboxChange(event) {
        const checkbox = event.target;
        const userName = checkbox.nextSibling.textContent;

        if (checkbox.checked) {
            selectedUserIds.push(checkbox.value);
            selectedUsernames.push(userName);
        } else {
            const index = selectedUserIds.indexOf(checkbox.value);
            if (index > -1) {
                selectedUserIds.splice(index, 1);
                selectedUsernames.splice(index, 1);
            }
        }

        // Re-render to reflect changes
        const input = document.getElementById('contact_username').value;
        if (input.length >= 3) {
            FetchUsernames(input).then(users => {
                DisplayMatchingUsernames(users, users.length === 0 ? "No matching users found." : "");
            });
        } else {
            DisplayMatchingUsernames([], "Please enter at least 3 characters.");
        }
    }

    function AddContact(selectedUserIds){
        selectedUserIds.forEach((id) => {
            AddToArray(currentUser.uid, "Contacts", id);
        })
    }

    function DisplayProfileSettings() {
        console.info("DisplayProfileSettings()");
    }

    // Display discussions
    async function DisplayDiscussions(containerId) {
        const discussions = await FetchDiscussions(currentUser);

        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear previous content

        discussions.forEach(discussion => {
            const discussionDiv = document.createElement('div');
            discussionDiv.classList.add('chat-list');

            const discussionLink = document.createElement('a');
            discussionLink.classList.add('d-flex', 'align-items-center');
            discussionLink.addEventListener('click', () => {
                DisplayMessages(discussion.id);
            });

            const userImg = document.createElement('img');
            userImg.classList.add('img-fluid');
            userImg.src = 'https://mehedihtml.com/chatbox/assets/img/user.png';
            userImg.alt = 'user img';

            const discussionDetails = document.createElement('div');
            discussionDetails.classList.add('flex-grow-1', 'ms-3');

            const discussionName = document.createElement('h3');
            discussionName.textContent = discussion.data.Name;

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
    async function DisplayMessages(discussionId) {
        const msgBody = document.querySelector('.msg-body ul');
        msgBody.innerHTML = ''; // Clear previous messages

        const messages = await FetchMessages(discussionId);

        let LastMessageDay = null;
        messages.forEach(message => {
            const messageData = message.data;
            const messageDate = new Date(messageData.Timestamp);
            const messageDay = messageDate.getDay();

            // Display date divider if it's a new date
            if (messageDay !== LastMessageDay) {
                const divider = document.createElement('li');
                divider.classList.add('divider');
                divider.innerHTML = `<h6>${messageDate}</h6>`;
                msgBody.appendChild(divider);
                LastMessageDay = messageDay;
            }

            // Create message element
            const messageLi = document.createElement('li');
            
            messageLi.classList.add(messageData.Auth === currentUser ? 'sender' : 'reply');
            messageLi.innerHTML = `<p>${messageData.Text}</p><span class="time">${messageDate.toLocaleTimeString()}</span>`;
            msgBody.appendChild(messageLi);
        });
    }
});

export { currentUser, logged };