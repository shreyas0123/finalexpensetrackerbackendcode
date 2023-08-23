const AWS = require('aws-sdk');
require('dotenv').config(); // This loads the .env file into process.env

/********************** code for uploading file to aws s3 */

//we created services folder in order to improve the design pattern
//in this folder we are doing network calls. It basically means --- DB calls (Relational database scheme),s3 calls(aws s3 using), api calls
//here we are separating the code so that we can use this code or functionality in other code also

const uploadToS3 = (data, filename) => {
    // Define AWS S3 bucket credentials
    const BUCKET_NAME = 'expensetrackingapp554'; //creating bucket called expensetrackingapp554
    const IAM_USER_KEY = process.env.IAM_USER_KEY;  //get it from iam user credentials
    const IAM_USER_SECRET = process.env.IAM_USER_SECRET; //get it from iam users credentials

    // Create an instance of AWS S3 service
    let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET
    });

    // Configure upload parameters
    var params = {
        Bucket: BUCKET_NAME,  // Target S3 bucket name
        Key: filename,        // Target filename within the bucket
        Body: data,           // The data to be uploaded
        ACL: 'public-read'    // Set access permissions for the uploaded object (here public can access the file)
    };

    // Return a Promise to handle the upload operation asynchronously
    return new Promise((resolve, reject) => {
        // Initiate the S3 upload
        s3bucket.upload(params, (err, s3response) => {
            if (err) {
                console.log('something went wrong', err);
                reject(err); // Reject the Promise if upload encounters an error
            } else {
                console.log('success', s3response);
                resolve(s3response.Location); // Resolve the Promise with the URL of the uploaded object
            }
        });
    });
};

module.exports = {
    uploadToS3
}