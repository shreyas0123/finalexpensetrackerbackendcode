const sib = require("sib-api-v3-sdk"); // SendinBlue library for email service
const uuid = require("uuid"); 
// Library to generate UUIDs.this is a uuid (unique identifier just like id but it is normally a long string so that other people cannot guess )
 const bcrypt = require("bcrypt"); // Library for password hashing
const user = require("../models/signup"); 
const forgotpassword = require("../models/forgotpassword"); 
require("dotenv").config(); // Load environment variables from .env file

// Function to initiate the forgot password process
exports.forgotpassword = async (req, res) => {
    try {
        const email = req.body.email; // Get the email from the request body

        // Check if a user with the provided email exists in the database
        const userFound = await user.findOne({ where: { email: email } });

        if (userFound) {
            // Generate a new UUID as a unique identifier for the reset password request
            const id = uuid.v4();

            // Create a new entry in the 'forgotpassword' table with the generated UUID and user ID
            await forgotpassword.create({
                id,
                isactive: true, // Set 'isactive' to true for this reset password request
                userId: userFound.id, // Store the associated user ID
            });

            // Configure the SendinBlue API client with the provided API key from the .env file
            const client = sib.ApiClient.instance;
            const apiKey = client.authentications["api-key"];
            apiKey.apiKey = process.env.API_KEY;

            // Create a new instance of the SendinBlue TransactionalEmailsApi
            const transEmailApi = new sib.TransactionalEmailsApi();

            // Configure the email sender and receiver details
            const sender = {
                email: "shreyasgowdaab@gmail.com",
                name: "Shreyas",
            };
            const receivers = [{ email: email }];

            // Send the transactional email with a link for resetting the password
            const data = await transEmailApi.sendTransacEmail({
                sender,
                to: receivers,
                subject: "Please reset your password",
                htmlContent: `
                    <a href="http://localhost:3000/resetpassword/${id}">Reset password</a>
                `,
            });

            console.log(data); // Log the SendinBlue API response (optional)

            // Send a success response indicating that the reset password link has been sent to the user's email
            res.json({ success: true, message: "Reset password link is successfully sent to your email address" });
        } else {
            // If the user with the provided email doesn't exist, send an error response
            console.log("user doesn't exist");
            res.json({ message: "User does not exist", success: false });
        }
    } catch (err) {
        // If an error occurs during the forgot password process, log the error and send an error response
        console.log("error in forgot password -->", err);
        res.json({ Error: err });
    }
};

// Function to handle the reset password page
exports.resetpassword = async (req, res) => {
    try {
        const id = req.params.id; // Get the unique identifier from the request parameters

        // Find the corresponding reset password entry in the 'forgotpassword' table
        const forgotPassword = await forgotpassword.findOne({ where: { id: id } });

        if (forgotPassword) {
            // Mark the reset password token as inactive by updating 'isactive' to false
            await forgotPassword.update({ isactive: false });

            // Send an HTML response to the client with a form to enter the new password
            res.send(`
                <html>
                    <script>
                        function formsubmitted(e) {
                            e.preventDefault();
                            console.log('called');
                        }
                    </script>
                    <body>
                        <header>
                            <h1>Enter your New Password</h1>
                        </header>
                        <form action="/updatepassword/${id}" method="get">
                            <label for="newpassword">Enter New Password</label>
                            <input name="newpassword" type="password" required></input><br><br>
                            <button>Reset Password</button>
                        </form>
                    </body>
                </html>
            `);
            res.end();
        }
    } catch (err) {
        // If an error occurs during the reset password page rendering, log the error and send an error response
        console.log("reset password error", err);
        res.json({ Error: err });
    }
};

// Function to update the user's password with the new one
exports.updatepassword = async (req, res) => {
    try {
        const { newpassword } = req.query; // Get the new password from the request query parameters
        const { resetpassword } = req.params; // Get the reset password token from the request parameters

        // Find the corresponding reset password entry in the 'forgotpassword' table
        const findUser = await forgotpassword.findOne({ where: { id: resetpassword } });

        // Find the user associated with the 'userId' from the 'forgotpassword' entry
        const data = await user.findOne({ where: { id: findUser.userId } });

        if (data) {
            // Hash the new password using bcrypt with a salt factor of 10
            bcrypt.hash(newpassword, 10, async (err, hash) => {
                if (err) {
                    // If an error occurs during the hashing process, send an error response
                    res.json({ Error: err });
                }
                // Update the user's password with the newly generated hash
                const data2 = await data.update({ password: hash });
                // Send a response containing the updated user data
                res.json({ data: data2 });
            });
        }
    } catch (err) {
        // If an error occurs during the password update, log the error and send an error response
        console.log("update password error -->", err);
        res.json({ Error: err });
    }
};
