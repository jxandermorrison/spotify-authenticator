const path = require("path");
const express = require("express");
const cors = require("cors");
const queryString = require("query-string");
const cookieParser = require('cookie-parser');
const request = require("request");

let client_id = '';
let client_secret = '';
let redirect_uri = '';

const app = express();

const stateKey = "spotify_auth_state";

function generateRandom(length) {
	let txt = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

	for (var i = 0; i < length; ++i)
		txt += possible.charAt(Math.floor(Math.random() * possible.length));
	return txt;
}

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(cookieParser());

app.get('/', (req, res) => {
	res.send("Hello world");
});

app.get('/login', function(req, res) {
	
	let state = generateRandom(16);
	res.cookie(stateKey, state);
	
	let scope = "user-read-private user-read-email";
	res.redirect("https://accounts.spotify.com/authorize?" +
		queryString.stringify({
			response_type: 'code',
			client_id: client_id,
			scope: scope,
			redirect_uri: redirect_uri,
			state: state
		})
	);
});

app.get('/callback', function(req, res) {

	
	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		res.redirect('/#' + queryString.stringify({
			error: 'state_mismatch'
		}));
	}
	else {
		res.clearCookie(stateKey);

		let authOptions = {
			url: "https://accounts.spotify.com/api/token",
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: "authorization_code"
			},
			headers: {
				"Authorization": "Basic " + (new Buffer(client_id + ":" + client_secret).toString('base64'))
			},
			json: true
		}

		request.post(authOptions, function(err, response, body) {
			if (!err && response.statusCode === 200) {

				let access_token = body.access_token;
				let refresh_token = body.refresh_token;

				res.send("Success");

				// store in database
			}
			else {
				res.redirect('/#' + 
					queryString.stringify({
						error: 'invalid_token'
					})
				);
			}
		});
	}
});

let port = 3000;

app.listen(port, () => console.log(`*Listening on ${port}`));
