// todo: https://www.npmjs.com/package/prettier

require("dotenv").config();

console.log(process.env.VAR);

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
// const MongoStore = require("connect-mongo");
// todo: https://www.npmjs.com/package/connect-mongo


// mongodb://user@pass:url.com/

let app = express();

app.use(bodyParser.json());

app.use(session({ secret: "foo" }));

const isLoggedIn = (req, res, next) =>
{
	// req.session.loggedIn = true;
	// console.log(req.session);
	if (!req.session.loggedIn)
	{
		res.status(401);
		return res.send("you aint logged in boi");
	}
	next();
};

app.get("/", isLoggedIn, function(req, res)
{
	res.setHeader("Content-Type", "text/html");
	res.write("<p>you are logged in </p>");
	res.end();
});

app.post("/logout", (req, res) =>
{
	res.status(200);
	if (req.session.loggedIn)
	{
		req.session.loggedIn = false;
		res.send({ message: "You have been loffed out" });
		return;
	}
	else
	{
		res.send({ message: "Yo dude, you weren't loffed in, but like, I gotchu fam" });
		return;
	}
});

let db = [
	{
		_id: "123",
		user: "user",
		pass: "pass",
		name: "john smith",
		classes: [1, 2, 3, 4, 5, 69],
	},
	{
		_id: "456",
		user: "user2",
		pass: "pass2",
		name: "john smith",
		classes: [1, 2, 3, 4, 5, 69],
	},
];

// defined by mongo thing
function checkDatabase(email, pass)
{
	if (email === "penis" && pass === "penis")
	{
		return db[1];
	}
	else
	{
		return null;
	}
}

function hash(pass)
{
	return pass;
}

app.post("/login", (req, res) =>
{
	// required
	let email = req.body.email;
	let pass = hash(req.body.pass);

	if (email == null || pass == null)
	{
		res.status(400);
		return res.send({
			message: "missing body, 'email' and 'password' are required",
			errorBody: { a: "a", },
		});
	}

	let hashedPass = hash(pass);

	console.log(email, hashedPass);
	let user = checkDatabase(email, hashedPass);
	console.log(user);

	if (user)
	{
		req.session.loggedIn = true;

		delete user.pass;

		res.status(200);
		return res.send(user);
	}
	else
	{
		res.status(400);
		return res.send({
			message: "invalid email and/or password",
			errorBody: { a: "a", },
		});
	}
});

app.get ("/session", (req, res) =>
{
	res.send(req.session);
});


app.listen(5000);
