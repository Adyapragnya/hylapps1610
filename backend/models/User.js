const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userType: {
    type: String,
    required: true,
    enum: ['organizational user', 'guest'], 
  },
  selectedOrganization: {
    type: String,
    required: function() { return this.userType === 'organizational user'; },
  },
  address: {
    type: String,
    required: function() { return this.userType === 'organizational user'; },
  },
  contactEmail: {
    type: String,
    required: function() { return this.userType === 'organizational user'; },
  
  },
  userFirstName: {
    type: String,
    required: true,
  },
  userLastName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
   
  },
  userContactNumber: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // automatically manage createdAt and updatedAt fields
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
