const { SquareClient, SquareEnvironment } = require("square");
const { randomUUID } = require("crypto");

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const { itemId, variationId: passedVariationId, quantity = 1 } = data;

        let variationId = passedVariationId;

        if (!variationId) {
            // Fall back to fetching item and using first variation
            if (!itemId) {
                return { statusCode: 400, body: JSON.stringify({ error: "Missing variationId or itemId" }) };
            }
            const itemResult = await client.catalog.object.get({ objectId: itemId });
            variationId = itemResult.object.itemData.variations[0].id;
        }

        const checkoutResult = await client.checkout.paymentLinks.create({
            idempotencyKey: randomUUID(),
            order: {
                locationId: process.env.SQUARE_LOCATION_ID || process.env.SQUARE_APP_ID,
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
            body: JSON.stringify({ url: checkoutResult.paymentLink.url }),
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
