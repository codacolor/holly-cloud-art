document.addEventListener('DOMContentLoaded', () => {
    const shopContainer = document.getElementById('shop-container');
    if (!shopContainer) return;

    fetch('/.netlify/functions/get-catalog')
        .then(res => res.json())
        .then(items => {
            if (items.error) {
                console.error('Error fetching items:', items.error);
                shopContainer.innerHTML = '<p>Sorry, unable to load products at this time.</p>';
                return;
            }

            if (items.length === 0) {
                shopContainer.innerHTML = '<p>No products found.</p>';
                return;
            }

            const grid = document.createElement('div');
            grid.className = 'shop-grid';

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'product-card';

                const img = document.createElement('img');
                img.src = item.imageUrl || 'images/placeholder-product.jpg'; // Need a placeholder?
                img.alt = item.name;
                img.className = 'product-image';

                const title = document.createElement('h3');
                title.textContent = item.name;

                const price = document.createElement('p');
                price.className = 'product-price';
                // Only support USD/basic formatting for now
                price.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format(item.price / 100);

                const btn = document.createElement('button');
                btn.className = 'btn btn-primary buy-btn';
                btn.textContent = 'Buy Now';
                btn.onclick = () => initiateCheckout(item.variationId || item.id); // Use variation ID if available

                card.appendChild(img);
                card.appendChild(title);
                card.appendChild(price);
                card.appendChild(btn);
                grid.appendChild(card);
            });

            shopContainer.appendChild(grid);
        })
        .catch(err => {
            console.error(err);
            shopContainer.innerHTML = '<p>Loading failed.</p>';
        });
});

function initiateCheckout(itemId) {
    fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ itemId: itemId, quantity: 1 })
    })
        .then(res => res.json())
        .then(data => {
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Checkout creation failed');
            }
        })
        .catch(err => alert('Error starting checkout'));
}
