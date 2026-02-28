// Helper to get location if not set in env
async function getLocationId(client) {
    if (process.env.SQUARE_LOCATION_ID) return process.env.SQUARE_LOCATION_ID;

    try {
        const { result } = await client.locationsApi.listLocations();
        // Return the first main location
        const mainLocation = result.locations.find(l => l.status === 'ACTIVE');
        return mainLocation?.id;
    } catch (e) {
        console.error("Failed to fetch location", e);
        return null;
    }
}
