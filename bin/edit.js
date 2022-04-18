import axios from "axios";
import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/schemaRules", (req, res) => {
	const { groupId, appId, apiKey, cluster, collection } = req.body;
	if (!groupId) {
		res.status(500).send("Missing either groupId");
	}
	if (!apiKey || !apiKey.public || !apiKey.private) {
		res.status(500).send("apiKey missing or invalid");
	}
	axios
		.post("https://realm.mongodb.com/api/admin/v3.0/auth/providers/mongodb-cloud/login", {
			username: apiKey.public,
			apiKey: apiKey.private,
		})
		.then((response) => {
			const { access_token } = response.data;
			if (!access_token) {
				res.status(500).send("Failed to get access token");
			}
			axios
				.get(`https://realm.mongodb.com/api/admin/v3.0/groups/${groupId}/apps/${appId}/services`, {
					headers: {
						Authorization: `Bearer ${access_token}`,
					},
				})
				.then((serviceRes) => {
					const serviceId = serviceRes.data[0]._id;
					axios
						.post(
							`https://realm.mongodb.com/api/admin/v3.0/groups/${groupId}/apps/${appId}/schemas`,
							{
								schema: {
									_id: { bsonType: "objectId" },
									name: { bsonType: "string" },
								},
								metadata: {
									data_source: "mongodb-atlas",
									database: cluster,
									collection: collection,
								},
							},
							{
								headers: {
									Authorization: `Bearer ${access_token}`,
								},
							}
						)
						.catch((err) => {
							console.error(err.message);
						});
					axios
						.post(
							`https://realm.mongodb.com/api/admin/v3.0/groups/${groupId}/apps/${appId}/services/${serviceId}/rules`,
							{
								database: "testing",
								collection: "testcollection18",
								roles: [
									{
										name: "default",
										apply_when: {},
										write: true,
										insert: false,
										delete: false,
										search: true,
										additional_fields: {},
									},
								],
							},
							{
								headers: {
									Authorization: `Bearer ${access_token}`,
								},
							}
						)
						.catch((err) => {
							console.error(err.message);
						});
				});
		})
		.then(() => {
			res.status(201).send("Successfully edited schema and rules");
		});
});

const PORT = 5050;

app.listen(PORT, () => {
	console.log("App running in localhost:" + PORT);
});
