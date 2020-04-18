const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


exports.vote = functions.https.onRequest(async (req, res) => {
    let votes = req.body.votes;
    console.log(req.body.votes)
    
    //do something and then return a 201
    res.status(201).send()
})
