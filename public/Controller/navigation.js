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
        try {
            // get the html from the template
            // set the content of the content div to the html
            contentContainer.innerHTML = await fetch(route.page).then((response) => response.text());
            // set the title of the document to the title of the route
            document.title = route.title;
            // set the description of the document to the description of the route
            document
                .querySelector('meta[name="description"]')
                .setAttribute("content", route.description);
        } catch (error) {
            console.error("Error loading content:", error);
            contentContainer.innerHTML = "<h1>Error loading page</h1>";
            document.title = "Error";
            // set the description of the document to the description of the route
            document
                .querySelector('meta[name="description"]')
                .setAttribute("content", "Error loading page");
        }
    };

    /**
     * Function to handle hash change
     */
    const handleHashChange = () => {
        let hash = localStorage.getItem('logged') === "true" ? "home" : "loginOrRegister";
        loadContent(hash).then(r=>loadContent(hash));
    };

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Call handleHashChange initially to load the appropriate content
    handleHashChange();
});