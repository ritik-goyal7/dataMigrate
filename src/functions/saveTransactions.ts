import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { MongoClient } from "mongodb";

export async function saveTransactions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('HTTP trigger function processed a request.');

    const cosmosDbUri = process.env.COSMOS_DB_URI;
    const cosmosDbName = process.env.COSMOS_DB_NAME;
    const cosmosDbCollection = process.env.COSMOS_DB_COLLECTION;

    if (!cosmosDbUri || !cosmosDbName || !cosmosDbCollection) {
        return {
            status: 500,
            body: "Cosmos DB configuration is missing."
        };
    }

    let client: MongoClient;

    try {
        client = new MongoClient(cosmosDbUri);
        await client.connect();

        const database = client.db(cosmosDbName);
        const collection = database.collection(cosmosDbCollection);

        const transaction = request.body;

        if (!transaction) {
            return {
                status: 400,
                body: "Please pass a transaction in the request body"
            };
        }

        const result = await collection.insertOne(transaction);

        return {
            status: 200,
            body: `Transaction saved successfully. id: ${result.insertedId}`
        };
    } catch (error) {
        context.error("An error occurred:", error);
        return {
            status: 500,
            body: "An error occurred while saving the transaction."
        };
    } finally {
        await client?.close();
    }
};

app.http('saveTransactions', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: saveTransactions
});
