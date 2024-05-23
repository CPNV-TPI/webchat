/*
* Name : navigation.js
* Author : JSO
* Modified : 23.05.2024
* */

// Import the logged and loggedChangeEvent from your model
import { logged } from '../Model/auth.js';

document.addEventListener('DOMContentLoaded', function () {
    const pageTitle = "WebChat";
    const contentContainer = document.getElementById('content');

    // Define routes with corresponding HTML page paths
    const routes = {
        lost: {
            page: "404.html",
            title: "404 | " + pageTitle,
            description: "Page not found",
        },
        home: {
            page: "/View/home.html",
            title: "Home | " + pageTitle,
            description: "This is the home page",
        },
        loginOrRegister: {
            page: "/View/loginOrRegister.html",
            title: "Login or register | " + pageTitle,
            description: "This is the login or register page",
        }
    };

    /**
     * Function to load content based on hash value
     */
    const loadContent = async (hash) => {
        const route = routes[hash] || routes["lost"];
        contentContainer.innerHTML = await fetch(route.page).then((response) => response.text());
        document.title = route.title;
        document.querySelector('meta[name="description"]').setAttribute("content", route.description);
    };

    /**
     * Function to handle hash change
     */
    const handleHashChange = () => {
        let hash = logged ? "home" : "loginOrRegister";
        loadContent(hash).catch(error => {
            console.error("Error loading content:", error);
            loadContent("lost").catch(error => {
                console.error("Error loading content:", error);
                contentContainer.innerHTML = "<h1>Error loading page</h1>";
                document.title = "Error";
                document.querySelector('meta[name="description"]').setAttribute("content", "Error loading page");
            })
        });
    };

    // Add an event listener to listen for the 'loggedChange' event
    window.addEventListener('loggedChange', (event) => {
        handleHashChange();
        console.log('Login status changed');
    });

    // Function to wait for the login status to be determined
    const waitForLoginStatus = () => {
        if (typeof logged !== 'undefined') {
            handleHashChange();
        } else {
            setTimeout(waitForLoginStatus, 100); // Check again after 100ms
        }
    };

    // Call waitForLoginStatus initially to load the appropriate content
    waitForLoginStatus();
});