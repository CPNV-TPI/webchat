/*
* Name : app.js
* Author : JSO
* Modified : 23.05.2024
* */

// import functions and variables
import {logged, GoogleLogin, Login, Logout, Register, currentUser} from "./auth.js";
import { FetchDiscussions, FetchMessages, RemoveFromArray, AddToArray} from "./firestore.js";

let currentDiscussionID;
let currentDiscussionListener; // Store reference to the current Discussion listener

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
        const action = urlParams.get('action');

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

        // Check the value of the 'action' parameter and take appropriate action
        switch (action) {
            case "addContact":
                // AddContact function should be defined elsewhere
                AddContact()
                    .catch(error => {
                        console.error("Error adding contact:", error);
                        // Handle error appropriately, e.g., show an error message to the user
                    });
                break;
            //case "blockContact":
            //    // BlockContact function should be defined elsewhere
            //    BlockContact()
            //        .catch(error => {
            //            console.error("Error blocking contact:", error);
            //            // Handle error appropriately, e.g., show an error message to the user
            //        });
            //    break;
            //case 'seeContactProfile':
            //    // SeeContactProfile function should be defined elsewhere
            //    SeeContactProfile()
            //        .catch(error => {
            //            console.error("Error seeing contact profile:", error);
            //            // Handle error appropriately, e.g., show an error message to the user
            //        });
            //    break;
            case "createDiscussion":
                // CreateDiscussions function should be defined elsewhere
                CreateDiscussions()
                    .catch(error => {
                        console.error("Error creating discussion:", error);
                        // Handle error appropriately, e.g., show an error message to the user
                    });
                break;
            //case "archiveDiscussion":
            //    // ArchiveDiscussions function should be defined elsewhere
            //    ArchiveDiscussions()
            //        .catch(error => {
            //            console.error("Error archiving discussion:", error);
            //            // Handle error appropriately, e.g., show an error message to the user
            //        });
            //    break;
            default:
                // If action is not in the list of valid actions, remove it from the URL
                if (action) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('action');
                    window.history.replaceState(null, '', newUrl.toString());
                }
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

    function CreateDiscussions(){

    }

    function AddContact(){

    }

    function DisplayProfileSettings() {
        console.info("DisplayProfileSettings()");
    }

    // Display discussions
    async function DisplayDiscussions(containerId) {
        const discussions = await FetchDiscussions();

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