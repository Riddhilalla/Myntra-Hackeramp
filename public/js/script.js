async function getWishlist() {
    try {
    const userId = 'user-id'; // Replace with actual user ID
    const response = await fetch(`/wishlist/${userId}`);
    
        if (!response.ok) {
            throw new Error('Failed to fetch wishlist');
        }
        const wishlist = await response.json();

        const wishlistContainer = document.getElementById('wishlist');
        wishlistContainer.innerHTML = '';

        wishlist.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.textContent = `${item.name} - Rs $ {item.price}`;
            wishlistContainer.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error.message);
    }
}


async function addItem() {
    try{
    const userId = 'user-id'; // Replace with actual user ID
    const productId = document.getElementById('product-id').value;

    const response = await fetch(`/wishlist/${userId}/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
    });

    if (!response.ok) {
        throw new Error('Failed to add product to wishlist');
    }

    await getWishlist(); // Refresh wishlist after adding item
} catch (error) {
    console.error('Error adding item to wishlist:', error.message);
}
}

async function shareWishlist() {
    
    try {
        const userId = 'user-id'; // Replace with actual user ID from server-side
        const sharedEmail = document.getElementById('shared-user-email').value;

        const response = await fetch(`/wishlist/${userId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sharedEmail })
        });

        if (!response.ok) {
            throw new Error('Failed to share wishlist');
        }

        const data = await response.json();
        console.log('Wishlist shared:', data.message);
    } catch (error) {
        console.error('Error sharing wishlist:', error.message);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    getWishlist(); 

    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', shareWishlist);
    }
});