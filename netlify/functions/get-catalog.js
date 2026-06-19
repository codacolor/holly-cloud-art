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

        // Determine sold-out status from inventory counts for tracked variations.
        // Square's "Mark as sold out" sets locationOverrides[].soldOut; inventory-tracked
        // items go to quantity 0. We read both so either action marks an item sold.
        const variationIds = [];
        result.objects.forEach(item => {
            (item.itemData.variations || []).forEach(v => variationIds.push(v.id));
        });

        const stockByVariation = {}; // variationId -> total quantity across locations
        if (variationIds.length > 0) {
            try {
                const inv = await client.inventory.batchGetCounts({
                    catalogObjectIds: variationIds,
                });
                // batchGetCounts returns a paginated Page; iterate all counts.
                for await (const c of inv) {
                    if (c.state === 'IN_STOCK') {
                        const id = c.catalogObjectId;
                        stockByVariation[id] = (stockByVariation[id] || 0) + Number(c.quantity || 0);
                    }
                }
            } catch (invErr) {
                console.error('Inventory lookup failed:', invErr.message);
            }
        }

        // A variation is sold out if Square's soldOut override is set, OR
        // inventory is tracked for it and the in-stock quantity is 0.
        function variationSoldOut(v) {
            const overrides = v.itemVariationData.locationOverrides || [];
            if (overrides.some(o => o.soldOut === true)) return true;
            const tracked = overrides.some(o => o.trackInventory === true);
            if (tracked && (stockByVariation[v.id] || 0) <= 0) return true;
            return false;
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

            // Resolve all category names from related objects (item can belong to multiple)
            const categoryIds = new Set();
            if (itemData.categoryId) categoryIds.add(itemData.categoryId);
            if (itemData.reportingCategory && itemData.reportingCategory.id) categoryIds.add(itemData.reportingCategory.id);
            (itemData.categories || []).forEach(c => { if (c.id) categoryIds.add(c.id); });

            const categoryNames = [];
            categoryIds.forEach(catId => {
                const catObj = (result.relatedObjects || []).find(obj => obj.id === catId && obj.type === 'CATEGORY');
                if (catObj && catObj.categoryData && catObj.categoryData.name) categoryNames.push(catObj.categoryData.name);
            });
            const categoryName = categoryNames[0] || null; // keep for backwards compat

            // All variations (sizes)
            const variations = itemData.variations.map(function(v) {
                let vPrice = 0, vCurrency = 'USD';
                if (v.itemVariationData.priceMoney) {
                    vPrice = Number(v.itemVariationData.priceMoney.amount);
                    vCurrency = v.itemVariationData.priceMoney.currency;
                }
                return { id: v.id, name: v.itemVariationData.name, price: vPrice, currency: vCurrency, soldOut: variationSoldOut(v) };
            });

            // Item is sold out when every variation is sold out.
            const soldOut = variations.length > 0 && variations.every(v => v.soldOut);

            return {
                id: item.id,
                variationId: variation.id, // First variation (default)
                variations: variations,
                name: itemData.name,
                description: itemData.description,
                categoryName: categoryName,
                categoryNames: categoryNames,
                price: price, // First variation price, in cents
                currency: currency,
                imageUrl: imageUrl,
                soldOut: soldOut
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
