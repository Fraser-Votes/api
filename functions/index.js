const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
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
                userUD: context.auth.token.uid,
                votes: data.votes
            })
            batch.update(userRef, {voted: true})
            batch.commit().then((res) => {
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
