const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with actual clinic data
const clinics = [
  { name: "Austin Clinic", city: "Austin", zip: "73301", phone: "+15125551234" },
  { name: "Dallas Clinic", city: "Dallas", zip: "75201", phone: "+12145551234" },
  { name: "Houston Clinic", city: "Houston", zip: "77001", phone: "+17135551234" },
  { name: "San Antonio Clinic", city: "San Antonio", zip: "78201", phone: "+12105551234" },
  // Add all 12 clinics here...
];

// Function to find the nearest clinic
function findNearestClinic(location) {
  location = location.toLowerCase().trim();
  return clinics.find(c => c.city.toLowerCase() === location || c.zip === location);
}

// VAPI Webhook Route
app.post("/webhook", express.json(), async (req, res) => {
  const { caller_id, session_id } = req.body;
  
  // Step 1: Ask the user for their location
  const askLocation = await axios.post(`https://api.vapi.ai/v1/calls/${session_id}/messages`, {
    text: "Can you tell me the city or zip code you're calling from?"
  });

  // Wait for user's response
  const userResponse = await axios.get(`https://api.vapi.ai/v1/calls/${session_id}/messages`);
  const userLocation = userResponse.data.messages.slice(-1)[0]?.text;

  // Step 2: Find the nearest clinic
  const clinic = findNearestClinic(userLocation);

  if (clinic) {
    // Step 3: Inform the caller and transfer the call
    await axios.post(`https://api.vapi.ai/v1/calls/${session_id}/messages`, {
      text: `I will now transfer you to ${clinic.name} in ${clinic.city}.`
    });

    // Step 4: Transfer the call
    await axios.post(`https://api.vapi.ai/v1/calls/${session_id}/transfer`, {
      phone_number: clinic.phone
    });

  } else {
    // If no clinic is found, inform the user
    await axios.post(`https://api.vapi.ai/v1/calls/${session_id}/messages`, {
      text: "I'm sorry, I couldn't find a clinic near you. Please try again."
    });
  }

  res.sendStatus(200);
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
