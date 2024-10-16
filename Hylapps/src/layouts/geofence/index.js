import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import axios from "axios";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MyMapComponent from "./MyMapComponent";
import GeofenceMessage from "./GeofenceMessage";
import GeofenceList from "./GeofenceList";
import { ToastContainer, toast } from 'react-toastify'; // Import Toast components
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS

function Geofence() {
  const [vessels, setVessels] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [vesselEntries, setVesselEntries] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Handle row click
  const handleRowClick = (vessel) => {
    const selected = vessels.find(v => v.name === vessel.vesselName);
    if (selected) {
      setSelectedVessel(selected);
    }
  };

  const calculateMapCenter = () => {
    if (vessels.length === 0) return [0, 0];
    const latSum = vessels.reduce((sum, vessel) => sum + vessel.lat, 0);
    const lngSum = vessels.reduce((sum, vessel) => sum + vessel.lng, 0);
    return [latSum / vessels.length, lngSum / vessels.length];
  };

  const center = selectedVessel ? [selectedVessel.lat, selectedVessel.lng] : calculateMapCenter();
  const zoom = selectedVessel ? 10 : 6;

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    axios.get(`${baseURL}/api/get-tracked-vessels`)
      .then((response) => {
        const formattedData = response.data.map((vessel) => ({
          name: vessel.AIS.NAME || "",
          lat: Number(vessel.AIS.LATITUDE) || 0,
          lng: Number(vessel.AIS.LONGITUDE) || 0,
          heading: vessel.AIS.HEADING || 0,
          destination: vessel.AIS.DESTINATION || "",
          speed: vessel.AIS.SPEED || 0,
        }));
        setVessels(formattedData);
      })
      .catch((err) => {
        console.error("Error fetching vessel data:", err);
      });
  }, []);

  // Log the vesselEntries whenever it changes
  useEffect(() => {
    console.log("Vessel Entries Updated:", vesselEntries);
  }, [vesselEntries]);

  // Modify handleNewGeofenceEntry to include the vessel's name and geofence details
  const handleNewGeofenceEntry = (message, vessel) => {
    setNotifications((prev) => [
      ...prev,
      {
        title: `${vessel.name} has entered ${message.title}`,
        date: new Date().toLocaleTimeString(),
        image: <img src={team2} alt="vessel" />,
      }
    ]);
  };

  // Disable keyboard shortcuts and mouse zoom
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Disable function keys (F1-F12) and Ctrl +/- 
      if (event.key.startsWith('F') || (event.ctrlKey && (event.key === '+' || event.key === '-'))) {
        event.preventDefault();
        toast.warning("THIS FUNCTION IS DISABLED"); // Show toast alert
      }
    };

    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        toast.warning("THIS FUNCTION IS DISABLED"); // Show toast alert
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} /> {/* Toast container */}
      <DashboardNavbar vesselEntries={vesselEntries} />
      <ArgonBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <MyMapComponent
                  zoom={zoom}
                  center={center}
                  vessels={vessels}
                  selectedVessel={selectedVessel}
                  setVesselEntries={setVesselEntries}
                  onNewGeofenceEntry={handleNewGeofenceEntry}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={3}>
            <Card sx={{ height: "550px" }}>
              <CardContent>
                <GeofenceList
                  
                  onRowClick={handleRowClick}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={9}>
            <Card sx={{ height: "550px" }}>
              <CardContent>
                <GeofenceMessage
                  vesselEntries={vesselEntries}
                  vessels={vessels}
                  onRowClick={handleRowClick}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Geofence;
