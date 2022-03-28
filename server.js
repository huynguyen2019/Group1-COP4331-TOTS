// todo: https://www.npmjs.com/package/prettier

require("dotenv").config();

if (process.env.ENV_CHECKER == "true")
{
	console.log("The env file is hooked up");
}

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");

// mongodb://user@pass:url.com/
mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
const app = express();
app.use(bodyParser.json());
// app.use("/", express.static("frontend/public"));
app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.use(session({
	secret: "foo",
	store: MongoStore.create({
		mongoUrl: process.env.MONGO_CONNECTION_STRING,

		// time in seconds that session will expire 
		ttl: 30 * 60
	}),
	resave: true,
	saveUninitialized: true
}));
sgMail.setApiKey(process.env.REGISTER_AUTH_KEY);

app.get('/', function (req, res) {
  res.sendFile( __dirname + "/frontend/public/" + "index.html" );
});


app.get('/api', function (req, res) {
  res.send("lolz");
});
// generates a random verificationCode
function makeVerifCode()
{
	let result = "";
	let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let charactersLength = characters.length;
	for ( let i = 0; i < 4; i++ )
	{
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

app.post("/api/login", async(req, res) =>
{
	const { email, password } = req.body;
	const user = await User.findOne({ email }).lean();

	if (!user)
	{
		return res.json({ status: "error", error: "Invalid email/password" });
	}

	if (await bcrypt.compare(password, user.password))
	{
		// emall password is successful
		const token = jwt.sign({
			id: user._id,
			email: user.email
		}, process.env.JWT_SECRET);
		return res.json({ status: "ok", data: token });
	}

	res.json({ status: "error", error: "Invalid email/password" });
});

app.post("/api/register", async(req, res) =>
{
	const { email, password: plainTextPassword } = req.body;

	// if the email is empty or it is not a string
	if (!email || typeof email !== "string")
	{
		return res.json({ status: "error", error: "Invalid Email" });
	}

	if (email.match(/\S+@\S+\.\S+/) == null)
	{
		return res.json({ status: "error", error: "Invalid Email, must be in email format" });
	}

	// if the password is empty or it is not a string
	if (!plainTextPassword || typeof plainTextPassword !== "string")
	{
		return res.json({ status: "error", error: "Invalid Password" });
	}

	// if the password is not the correct length
	if (plainTextPassword.length <= 5)
	{
		return res.json({
			status: "error",
			error: "Password  too small. Should be at least 6 characters"
		});
	}

	const password = await bcrypt.hash(plainTextPassword, 10);
	const verifCode = makeVerifCode();

	// this is for email sending stuff
	const msg =
	{
	  to: "daniel.cosentinofl@gmail.com",
		from: "daniel.cosentinofl@gmail.com",
		subject: "Your Top o' the Schedule Registration Key",
		text: "Here is your Verification Code: " + verifCode
	};
	// await sgMail.send(msg);
	sgMail.send(msg)
		.then((a) =>
		{
			console.log(a);
		}, error =>
		{
			console.error(error);

			if (error.response)
			{
				console.error(error.response.body);
			}
		});

	try
	{
		const response = await User.create({
			email,
			password,
			verified: false,
			verifCode
		});
		console.log("user created successfully" + response);
	}
	catch (error)
	{
		if (error.code === 11000)
		{
			// duplicate key
			return res.json({ status: "error", error: "Email already in use" });
		}
		throw error;
	}
	res.status(200);
});

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

// app.get("/", isLoggedIn, function(req, res)
// {
// 	res.setHeader("Content-Type", "text/html");
// 	res.write("<p>you are logged in </p>");
// 	res.end();
// });


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
	if (email === "emopassword@gmail.com" && pass === "emopassword")
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

app.get("/end", (req, res) =>
{
	req.session.destroy(err =>
	{
		if (err)
		{
			console.log(err);
		}
		else
		{
			res.send("Session is destroyed");
		}
	});
	// THIS DESTROYS THE SESSION.
});

app.get("/session", (req, res) =>
{
	res.send(req.session);
});

let port = process.env.PORT || 5000; 
app.listen(port, () =>
{
	console.log("Server up at " + port);
});
