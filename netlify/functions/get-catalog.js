const { SquareClient, SquareEnvironment } = require("square");

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Use search to get items with images
        // We filter for ITEM type and include related objects (images)
        const result = await client.catalog.search({
            objectTypes: ["ITEM"],
            includeRelatedObjects: true,
        });

        if (!result.objects) {
            return {
                statusCode: 200,
                body: JSON.stringify([]),
            };
        }

        const items = result.objects.map(item => {
            const itemData = item.itemData;
            const variation = itemData.variations[0]; // Assuming single variation

            let price = 0;
            let currency = 'USD';
            if (variation.itemVariationData.priceMoney) {
                price = Number(variation.itemVariationData.priceMoney.amount);
                currency = variation.itemVariationData.priceMoney.currency;
            }

            // Resolve image URL
            let imageUrl = null;
            if (itemData.imageIds && itemData.imageIds.length > 0) {
                const imageId = itemData.imageIds[0];
                const imageObj = (result.relatedObjects || []).find(obj => obj.id === imageId && obj.type === 'IMAGE');
                if (imageObj) {
                    imageUrl = imageObj.imageData.url;
                }
            }

            return {
                id: item.id,
                variationId: variation.id, // Good for checkout
                name: itemData.name,
                description: itemData.description,
                price: price, // In cents
                currency: currency,
                imageUrl: imageUrl
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify(items),
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
