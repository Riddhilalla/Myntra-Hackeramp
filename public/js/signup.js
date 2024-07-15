function sidebar() {
    const options = document.querySelector('.options');
    options.classList.toggle('active');
}
document.getElementById('logosvg').addEventListener('click', sidebar);

function redirectToWishlist() {
    window.location.href = '/wishlist';
}

function redirectTocart() {
    window.location.href = '/cart';
}