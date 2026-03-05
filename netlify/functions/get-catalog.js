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

            // Resolve category name from related objects
            let categoryName = null;
            const catId = (itemData.reportingCategory && itemData.reportingCategory.id) || itemData.categoryId;
            if (catId) {
                const catObj = (result.relatedObjects || []).find(function(obj) {
                    return obj.id === catId && obj.type === 'CATEGORY';
                });
                if (catObj && catObj.categoryData) categoryName = catObj.categoryData.name || null;
            }

            // All variations (sizes)
            const variations = itemData.variations.map(function(v) {
                let vPrice = 0, vCurrency = 'USD';
                if (v.itemVariationData.priceMoney) {
                    vPrice = Number(v.itemVariationData.priceMoney.amount);
                    vCurrency = v.itemVariationData.priceMoney.currency;
                }
                return { id: v.id, name: v.itemVariationData.name, price: vPrice, currency: vCurrency };
            });

            return {
                id: item.id,
                variationId: variation.id, // First variation (default)
                variations: variations,
                name: itemData.name,
                description: itemData.description,
                categoryName: categoryName,
                price: price, // First variation price, in cents
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
