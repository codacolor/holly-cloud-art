const { Client, Environment } = require("square");
const { randomUUID } = require("crypto");

const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const { itemId, quantity = 1 } = data; // Expecting catalog object ID

        if (!itemId) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing itemId" }) };
        }

        // Retrieve the item to get the variation ID and price
        // Note: In a real app, you might pass variationId directly from frontend.
        // For now, let's assume we are sent the Item ID and we pick the first variation.
        const itemResponse = await client.catalogApi.retrieveCatalogObject(itemId);
        const item = itemResponse.result.object;
        const variationId = item.itemData.variations[0].id; // Default to first variation

        const response = await client.checkoutApi.createPaymentLink({
            idempotencyKey: randomUUID(),
            order: {
                locationId: process.env.SQUARE_LOCATION_ID || process.env.SQUARE_APP_ID, // TODO: Need location ID? Usually yes.
                lineItems: [
                    {
                        quantity: quantity.toString(),
                        catalogObjectId: variationId
                    }
                ]
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: response.result.paymentLink.url }),
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
