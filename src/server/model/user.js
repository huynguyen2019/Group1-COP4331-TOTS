const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		verified: { type: Boolean, required: true },
		verifCode: { type: String, requried: true }
	},
	{ collection: "Users" }
);

const model = mongoose.model("UserSchema", UserSchema);

module.exports = model;