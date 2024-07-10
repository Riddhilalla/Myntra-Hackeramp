document.addEventListener('DOMContentLoaded', () => {
    const userIdElement = document.getElementById('user-id');
    const userId = userIdElement ? userIdElement.getAttribute('data-user-id') : null;
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');

    if (userId) {
        wishlistBtns.forEach(btn => {
            btn.addEventListener('click', async (event) => {
                const productId = btn.closest('.product').getAttribute('data-product-id');
                const icon = btn.querySelector('.wishlist-icon path');
                console.log(userId);
                // Toggle icon color
                if (icon.getAttribute('fill') === '#ffffff') {
                    icon.setAttribute('fill', '#ff0000');  // Change to red filled heart
                } else {
                    icon.setAttribute('fill', '#ffffff');  // Change back to white stroke heart
                }

                // Add item to wishlist
                try {
                    await addItem(productId, userId);
                } catch (error) {
                    console.error('Error adding product to wishlist:', error);
                }
            });
        });
    } else {
        console.error('User ID not found');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.querySelector('.test-btn');

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                console.log(data);
            } catch (error) {
                console.error('Network error:', error);
            }
        });
    }
});

async function addItem(productId, userId) {
    try {
        const response = await fetch(`/wishlist/${userId}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        if (response.ok) {
            console.log('Product added to wishlist successfully');
        } else {
            const errorData = await response.json();
            console.error('Error adding product to wishlist:', errorData.error);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

function redirectToWishlist() {
    window.location.href = '/wishlist';
}