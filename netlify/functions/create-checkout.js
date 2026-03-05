const { SquareClient, SquareEnvironment } = require("square");
const { randomUUID } = require("crypto");

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);

        let lineItems;

        if (Array.isArray(data.lineItems) && data.lineItems.length > 0) {
            // Multi-item cart path
            lineItems = data.lineItems.map(item => ({
                quantity: String(item.quantity || 1),
                catalogObjectId: item.variationId
            }));
        } else {
            // Legacy single-item path (kept for safety)
            const { itemId, variationId: passedVariationId, quantity = 1 } = data;
            let variationId = passedVariationId;

            if (!variationId) {
                if (!itemId) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: "Missing variationId or itemId" })
                    };
                }
                const itemResult = await client.catalog.object.get({ objectId: itemId });
                variationId = itemResult.object.itemData.variations[0].id;
            }

            lineItems = [{ quantity: String(quantity), catalogObjectId: variationId }];
        }

        const SHIPPING_FEES = {
            us:   { amount: BigInt(800),  currency: 'USD', name: 'Shipping (United States)' },
            intl: { amount: BigInt(2200), currency: 'USD', name: 'Shipping (International)' }
        };
        const fee = SHIPPING_FEES[data.shippingZone] || SHIPPING_FEES.us;
        lineItems.push({
            name: fee.name,
            quantity: '1',
            basePriceMoney: { amount: fee.amount, currency: fee.currency }
        });

        const checkoutResult = await client.checkout.paymentLinks.create({
            idempotencyKey: randomUUID(),
            checkoutOptions: {
                askForShippingAddress: true
            },
            order: {
                locationId: process.env.SQUARE_LOCATION_ID || process.env.SQUARE_APP_ID,
                lineItems: lineItems
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
