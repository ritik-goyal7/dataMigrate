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

        context.info("Received req body: ", request.body);
        const transactions = ("orders" in request.body ? request.body["orders"] : []) as any[];

        if (!transactions || transactions.length === 0) {
            return {
                status: 400,
                body: "Please pass a transaction in the request body"
            };
        }

        const result = await collection.insertMany(transactions as any);

        return {
            status: 200,
            body: `Transaction saved successfully. id: ${result.insertedIds}`
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
