document.addEventListener('DOMContentLoaded', function () {
    const navbarContainer = document.getElementById('navbarContainer');
    const sidebarContainer = document.getElementById('sidebarContainer');

    // Fetch and insert navbar.html
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            navbarContainer.innerHTML = data;
        });

    // Fetch and insert sidebar.html
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            sidebarContainer.innerHTML = data;
        });
});
