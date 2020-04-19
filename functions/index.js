const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(require("../fraser-votes-firebase-adminsdk-tnue9-356f4872d6.json"))
});


exports.vote = functions.https.onCall(async (data, context) => {
    let votes = data.votes;
    console.log(data.votes)
    console.log(context.auth)

    return admin.firestore().collection("users").doc(context.auth.token.email.split("@")[0]).get().then(docSnapshot => {
        if (docSnapshot.exists) {
            let userData = docSnapshot.data()
            console.log(userData)
            if (!userData.voted) {
                admin.firestore().collection("ballots").add({
                    date:  admin.firestore.FieldValue.serverTimestamp(),
                    userGPG: context.auth.token.uid,
                    votes: data.votes
                })
            } else {    
                throw new functions.https.HttpsError("unauthorized operation", "this user has already voted")
            }
            return true
        } else {
            throw new functions.https.HttpsError("unauthorized operation", "this user is not authorized to perform this operation")
        }
    })
})
