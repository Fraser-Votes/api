const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const fetch = require('node-fetch');
admin.initializeApp({
    credential: admin.credential.applicationDefault() //must be set as an ENV variable to the path of the json file
});

let studentNumber = null;

async function getUser(email) {
    studentNumber = email.split("@")[0]
    return admin.firestore().collection("users").doc(studentNumber).get().then(docSnapshot => {
        if (docSnapshot.exists) {
            return docSnapshot.data()
        } else {
            return null
        }
    }).catch(err => {
        return err
    })
}

exports.vote = functions.https.onCall(async (data, context) => {
    let votes = data.votes;
    let userData = await getUser(context.auth.token.email)
    console.log(userData)
    if(userData) {
        if (!userData.voted) {
            let batch = admin.firestore().batch()
            let ballotRef = admin.firestore().collection("ballots").doc()
            let userRef = admin.firestore().collection("users").doc(studentNumber)

            // start making edits with the batch
            batch.create(ballotRef, {
                date:  admin.firestore.FieldValue.serverTimestamp(),
                userID: context.auth.uid,
                votes: data.votes
            })
            batch.update(userRef, {voted: true})
            batch.commit().then((res) => {
                fetch("https://plausible.io/api/event", {
                    "headers": {
                        "accept": "*/*",
                        "accept-language": "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
                        "content-type": "text/plain",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "cross-site"
                    },
                    "referrer": "https://fraservotes.com/login",
                    "referrerPolicy": "no-referrer-when-downgrade",
                    "body": "{\"name\":\"Vote\",\"url\":\"https://fraservotes.com/app/voting\",\"domain\":\"fraservotes.com\",\"referrer\":null,\"source\":null}",
                    "method": "POST",
                    "mode": "cors"
                });
                return true
            }).catch((err) => {
                throw new functions.https.HttpsError("error voting", err)
            })
        } else {    
            throw new functions.https.HttpsError("unauthorized operation", "this user has already voted")
        }
    } else {
        throw new functions.https.HttpsError("unauthorized operation", "user is not authorized to perform this operation")
    }

    return ({voteSuccessful: true})
})
