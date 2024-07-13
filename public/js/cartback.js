async function getProductDetails(productId) {
    try {
        const response = await fetch(`/products/${productId}`); // Adjust endpoint as per your server setup
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        const productDetails = await response.json();
        return productDetails;
    } catch (error) {
        throw new Error('Error fetching product details:', error.message);
    }
}
