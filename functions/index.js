const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initalizeApp();

exports.vote() = functions.https.onRequest(async (req, res) => {
    let votes = req.body.votes;
})
