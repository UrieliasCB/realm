#! /usr/bin/env node
// Imports
import { execSync } from "child_process";
import { MongoClient } from "mongodb";

// Constant declarations
const args = process.argv.slice(2);
const [collectionName, realmName, cluster, username, password, publicAPIKey, privateAPIKey] = args;

// Argument validation
if (!password) {
	throw "Not enough arguments, usage createrealm <collectionName> <realmName> <cluster> <username> <password>";
}

const mongoURL = `mongodb+srv://${username}:${password}@${cluster}.wulyt.mongodb.net/${cluster}?retryWrites=true&w=majority`;
const client = new MongoClient(mongoURL);

// Connection to MongoDB
try {
	await client.connect();
	await client.db(cluster).createCollection(collectionName);
} catch (e) {
	console.error(e);
}
await client.close();

// Execution of Realm CLI commands
execSync(
	`npm i realm-cli && realm-cli login --api-key ${publicAPIKey} --private-api-key ${privateAPIKey} && start realm-cli apps create -n ${realmName} --template "web.mql.todo" --cluster ${cluster}`
);
