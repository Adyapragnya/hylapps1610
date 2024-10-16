// routes/alertRoutes.js
const express = require('express');
const Alert = require('../models/Alert');
const router = express.Router();
const PolygonGeofence = require('../models/PolygonGeofence');
const Geofence = require('../models/Geofence');
const TrackedVessel = require('../models/TrackedVessel');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pointInPolygon = require('point-in-polygon');

// Create a transporter object with SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'admin@hylapps.com',
    pass: 'ngsl cgmz pnmt uiux',
  },
});

// Keep track of vessel geofence status
const vesselGeofenceStatus = new Map();

// API endpoint to create a new alert
router.post('/', async (req, res) => {
  try {
    const alertData = req.body;
    const newAlert = new Alert(alertData);
    await newAlert.save();
    res.status(201).json({ message: 'Alert saved successfully', alert: newAlert });
  } catch (error) {
    console.error('Error saving alert:', error);
    res.status(500).json({ message: 'Failed to save alert', error });
  }
});

// API endpoint to fetch all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Failed to fetch alerts', error });
  }
});

// Function to check if a vessel is inside a geofence

// Function to convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Function to check if a vessel is inside a circular geofence using the Haversine formula
const isInsideCircleGeofence = (vessel, geofence) => {
  const { LATITUDE, LONGITUDE } = vessel.AIS;
  const { coordinates } = geofence;

  // Access the first set of coordinates (circle geofence)
  const { lat: geofenceLat, lng: geofenceLng, radius } = coordinates[0];

  // Radius of the Earth in kilometers
  const R = 6371;

  // Convert latitude and longitude to radians
  const lat1 = toRadians(LATITUDE);
  const lon1 = toRadians(LONGITUDE);
  const lat2 = toRadians(geofenceLat);
  const lon2 = toRadians(geofenceLng);

  // Haversine formula to calculate the distance between two points on the Earth's surface
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance between the two points (in kilometers)
  const distance = R * c;

  // Convert radius from meters to kilometers
  const radiusInKm = radius / 1000;

  // Return true if the vessel is within the geofence radius
  return distance <= radiusInKm;
};



// Function to check if a vessel is inside a polygon geofence
const isInsidePolygonGeofence = (vessel, geofence) => {
  const { LATITUDE, LONGITUDE } = vessel.AIS;
  const coordinates = geofence.coordinates.map(coord => [coord.lat, coord.lng]);
  return pointInPolygon([LONGITUDE, LATITUDE], coordinates);
};

// Function to send an email
const sendEmail = async (to, subject, vesselName, geofenceName, geofenceType, alertMessage, message) => {
  const mailOptions = {
    from: 'admin@hylapps.com',
    to,
    subject,
    text: ` ${alertMessage}
  
Alert Details:
${message}

Should you require any further assistance, contact admin@hylapps.com.

Thank You,
HYLA Admin
www.greenhyla.com
  `,
  
  };


  

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to check alerts and send emails
// Function to check alerts and send emails
const checkAlerts = async () => {
  try {
    const alerts = await Alert.find();
    const vessels = await TrackedVessel.find();

    for (const alert of alerts) {
      if (alert.email) {
        const [geofenceName, geofenceType] = alert.geofence.split(' | ');

        let geofences;
        if (geofenceType === 'Polygon') {
          geofences = await PolygonGeofence.find({ geofenceName });
        } else {
          geofences = await Geofence.find({ geofenceName });
        }

        if (!geofences || geofences.length === 0) {
          console.error(`No geofences found for ${geofenceName} of type ${geofenceType}`);
          continue;
        }

        const selectedVessels = vessels.filter(vessel => alert.vesselSelected.includes(vessel.AIS.NAME));

        for (const geofence of geofences) {
          for (const vessel of selectedVessels) {
            const isInside = geofenceType === 'Polygon'
              ? isInsidePolygonGeofence(vessel, geofence)
              : isInsideCircleGeofence(vessel, geofence);

            const vesselKey = `${vessel.AIS.NAME}-${geofence.geofenceName}`;
            const previousStatus = vesselGeofenceStatus.get(vesselKey) || false;

          // Check if the vessel has entered the geofence

       
if (isInside && !previousStatus) {

  const date = new Date();
  const options = { day: '2-digit', month: 'short', year: '2-digit' };
  const formattedDate = date.toLocaleDateString('en-GB', options).replace(',', '');
 

  await sendEmail(
    'tech.adyapragnya@gmail.com , sales@adyapragnya.com , kdalvi@hylapps.com, abhishek.nair@hylapps.com' ,
    `HYLA Alert: "${vessel.AIS.NAME}" has arrived "${geofence.geofenceName}"`,
    vessel.AIS.NAME,
    geofence.geofenceName,
    geofenceType,
    `"${vessel.AIS.NAME}" has entered "${geofence.geofenceName}" , "${formattedDate}" .` ,
    alert.message
  );

  vesselGeofenceStatus.set(vesselKey, true); // Update status to inside
  console.log(`Alert email sent for vessel ${vessel.AIS.NAME} entered inside ${geofence.geofenceName}`);
} 
// Check if the vessel has exited the geofence
else if (!isInside && previousStatus) {
  // Vessel has exited the geofence

  const date = new Date();
  const options = { day: '2-digit', month: 'short', year: '2-digit' };
  const formattedDate = date.toLocaleDateString('en-GB', options).replace(',', '');

  
  await sendEmail(
    'tech.adyapragnya@gmail.com , sales@adyapragnya.com , kdalvi@hylapps.com, abhishek.nair@hylapps.com' ,
    `HYLA Alert: "${vessel.AIS.NAME}" has departed "${geofence.geofenceName}"`,
    vessel.AIS.NAME,
    geofence.geofenceName,
    geofenceType,
    `"${vessel.AIS.NAME}" has departed "${geofence.geofenceName}" , "${formattedDate}" .` ,
    alert.message
  );
  vesselGeofenceStatus.set(vesselKey, false); // Update status to outside
  console.log(`Alert email sent for vessel ${vessel.AIS.NAME} exited geofence ${geofence.geofenceName}`);
}

          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
};


// Schedule to check alerts every minute
cron.schedule('* * * * *', checkAlerts);

module.exports = router;
