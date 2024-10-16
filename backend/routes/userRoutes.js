
const express = require('express');
const User = require('../models/User'); // Adjust the path as needed
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const router = express.Router();
const LoginUsers = require('../models/LoginUsers'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const encryptionKey = 'mysecretkey';
// Secret key used for encryption and decryption (replace with your actual key)
const secretKey = '12345';
require('dotenv').config();



// Function to decrypt data (adjusted for your current encryption scheme)
const decryptData = (encryptedText) => {
  if (!encryptedText) {
    return null; // Handle empty or null data
  }

  try {
    // Decrypt using the same secret key as used in encryption
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedData || null;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};


// Function to send email with login details and reset token
const sendLoginEmail = async (adminEmail, password) => {
    try {
      const token = jwt.sign({ email: adminEmail }, encryptionKey, { expiresIn: '1h' }); // Generate a token
  
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email provider
        auth: {
          user: 'hylapps.admn@gmail.com',
          pass: 'myws cfuw isri uxko',
        },
      });
  
      const mailOptions = {
        from: 'hylapps.admn@gmail.com',
        to: adminEmail,
        subject: 'Your Organization Admin Account Details',
        text: `Welcome! Your account has been created. 
        Email: ${adminEmail}
        Temporary Password: ${password}
        REACT_APP_API_BASE_URL
         Please reset your password using this link: ${process.env.REACT_APP_API_BASE_URL}/authentication/reset-password?token=${token}`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Login email sent successfully.');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

// Create a new user
router.post('/create', async (req, res) => {
  try {
    const newUser = new User(req.body); // Create a new User instance from the request body
    await newUser.save(); // Save the user to the database

    const hashedPassword = CryptoJS.SHA256(decryptData(newUser.userContactNumber)).toString(); // Create hashed password for admin
    const OrgUserAndGuest = new LoginUsers({
        role: newUser.userType,
        email: decryptData(newUser.userEmail),  // Storing unencrypted email for login purposes
        password: hashedPassword, // Storing hashed password
      });
  
      await OrgUserAndGuest.save();
  
      // Send the email with the random login details
      await sendLoginEmail(decryptData(newUser.userEmail), decryptData(newUser.userContactNumber)); 
    res.status(201).json({ message: 'User created and email sent successfully', user: newUser });
  } catch (error) {
    console.error('Error creating User:', error); // Log the error for debugging
    res.status(500).json({ message: 'Error creating User or sending email.', error: error.message }); // Send error message
  }
});

// @desc Verify the password reset token
// @route GET /api/organizations/verify-token
// @access Public
router.get('/verify-token', (req, res) => {
    const { token } = req.query;
  
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
  
    jwt.verify(token, encryptionKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
  
      // Token is valid
      res.json({ message: 'Token is valid', email: decoded.email });
    });
  });



// Get organization data and decrypt sensitive fields
router.get('/getData', async (req, res) => {
  try {
    let organizations = await User.find(); // Fetch data from the database

    // Decrypt necessary fields for each organization
    organizations = organizations.map(org => ({
      ...org._doc,
      contactEmail: decryptData(org.contactEmail),
      userEmail: decryptData(org.userEmail),
      userContactNumber: decryptData(org.userContactNumber),
      // Decrypt other fields as needed
    }));

    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving data', error: error.message });
  }
});


module.exports = router;
