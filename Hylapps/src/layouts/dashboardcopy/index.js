import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import axios from "axios";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DetailedStatisticsCard from "examples/Cards/StatisticsCards/DetailedStatisticsCard";
import MyMapComponent from "./MyMapComponent";
import VesselDetailsTable from "./VesselDetailsTable";
import DashCard from "./DashCard";
import PieChartComponent from "./PieChartComponent"; // Import PieChartComponent
import LineChartComponent from "./LineChartComponent"; // Import LineChartComponent
import BarChartComponent from './BarChartComponent';

function Dashboardcopy() {
  const [vessels, setVessels] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [highlightRow, setHighlightRow] = useState(null);

  // New states for counts
  const [shipsAtSeaCount, setShipsAtSeaCount] = useState(0);
  const [shipsAtAnchorageCount, setShipsAtAnchorageCount] = useState(0);
  const [shipsAtBerthCount, setShipsAtBerthCount] = useState(0);
  const [totalShip, setTotalShip] = useState(0);
  const [destinationOptions, setDestinationOptions] = useState([]);

  // Example data for bar chart
const barChartData = [
  { month: "January", atSea: 30, atAnchorage: 25, atBerth: 15 },
  { month: "February", atSea: 28, atAnchorage: 22, atBerth: 18 },
  { month: "March", atSea: 35, atAnchorage: 30, atBerth: 20 },
  { month: "April", atSea: 40, atAnchorage: 35, atBerth: 25 },
  { month: "May", atSea: 45, atAnchorage: 32, atBerth: 30 },
  { month: "June", atSea: 50, atAnchorage: 40, atBerth: 35 },
  { month: "July", atSea: 55, atAnchorage: 38, atBerth: 40 },
  { month: "August", atSea: 60, atAnchorage: 45, atBerth: 50 },
  { month: "September", atSea: 50, atAnchorage: 42, atBerth: 45 },
  { month: "October", atSea: 48, atAnchorage: 50, atBerth: 55 },
  { month: "November", atSea: 35, atAnchorage: 38, atBerth: 40 },
  { month: "December", atSea: 40, atAnchorage: 45, atBerth: 50 }
];

  // Example data for charts
  const pieChartData = [
    { name: "At Sea", value: shipsAtSeaCount },
    { name: "At Anchorage", value: shipsAtAnchorageCount },
    { name: "At Berth", value: shipsAtBerthCount },
    // { name: "Total Ships", value: vessels.length },
  ];

  const lineChartData = [
    { name: "Ships at Sea", value: shipsAtSeaCount },
    { name: "Ships at Anchorage", value: shipsAtAnchorageCount },
    { name: "Ships at Berth", value: shipsAtBerthCount },
    // Add more data points as needed for the line chart
  ];

  const handleRefreshTable = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Update key to force refresh
  };

  const handleRowHighlight = (vessel) => {
    setHighlightRow(vessel); // Set the vessel to be highlighted
  };

  const CustomIcon = () => (
    <img src="/ship-berth.png" alt="Ship at berth" style={{ width: "40px", height: "40px" }} />
  );

  const handleRowClick = (vessel) => {
    setSelectedVessel(vessel);
  };

  const calculateMapCenter = () => {
    if (vessels.length === 0) return [0, 0];
    const latSum = vessels.reduce((sum, vessel) => sum + vessel.lat, 0);
    const lngSum = vessels.reduce((sum, vessel) => sum + vessel.lng, 0);
    return [latSum / vessels.length, lngSum / vessels.length];
  };

  const vesselsToDisplay = selectedVessel ? [selectedVessel] : vessels;

  const center = selectedVessel ? [selectedVessel.lat, selectedVessel.lng] : calculateMapCenter();
  const zoom = selectedVessel ? 2 : 6;

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    axios
      .get(`${baseURL}/api/get-tracked-vessels`)
      .then((response) => {
        const formattedData = response.data.map((vessel) => ({
          name: vessel.AIS.NAME || "",
          imo: Number(vessel.AIS.IMO) || 0,
          lat: Number(vessel.AIS.LATITUDE) || 0,
          lng: Number(vessel.AIS.LONGITUDE) || 0,
          heading: vessel.AIS.HEADING || 0,
          status: vessel.AIS.NAVSTAT || 0,
          eta: vessel.AIS.ETA || 0,
          destination: vessel.AIS.DESTINATION || 0,
        }));

        const destinations = [...new Set(formattedData.map(vessel => vessel.destination))];
        setDestinationOptions(destinations);
        
        // Calculate the counts based on NAVSTAT values
        const countAtSea = formattedData.filter((vessel) => vessel.status === 0).length;
        const countAtAnchorage = formattedData.filter(
          (vessel) => vessel.status === 1 || vessel.status === 3
        ).length;
        const countAtBerth = formattedData.filter(
          (vessel) => vessel.status === 5 || vessel.status === 7
        ).length;
        setShipsAtSeaCount(countAtSea);
        setShipsAtAnchorageCount(countAtAnchorage);
        setShipsAtBerthCount(countAtBerth);
        setVessels(formattedData);
      })
      .catch((err) => {
        console.error("Error fetching vessel data:", err);
        setError(err.message);
      });
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar showButton={true} dropdownOptions={destinationOptions} />
      <ArgonBox py={3}>
        <Grid container spacing={3} mb={0}>
          {/* Statistics Cards */}
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Ships at Sea"
              count={shipsAtSeaCount}
              icon={{ color: "info", component: <i className="fa fa-compass" /> }}
              percentage={{ color: "success", count: "+55%", text: "since yesterday" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Ships at Anchorage"
              count={shipsAtAnchorageCount}
              icon={{ color: "error", component: <i className="fa fa-anchor" /> }}
              percentage={{ color: "success", count: "+3%", text: "since last week" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Ships at Berth"
              count={shipsAtBerthCount}
              icon={{ color: "warning", component: <CustomIcon /> }}
              percentage={{ color: "error", count: "-2%", text: "since last quarter" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DetailedStatisticsCard
              title="Total Ships"
              count={vessels.length}
              icon={{ color: "primary", component: <i className="fa fa-ship" /> }}
              percentage={{ color: "success", count: "+5%", text: "than last month" }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={0} mt={6}>
          <Grid item xs={12} md={6} lg={12}>
            <DashCard
              title="Vessels Subscribed"
              count="20"
              icon={{ color: "info", component: <i className="fa fa-database" /> }}
              percentage={{ color: "success", count: "+55%", text: "since yesterday" }}
              onRefresh={handleRefreshTable}
              onHighlight={handleRowHighlight}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} mt={1}>
          {/* Card for Map */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: "#ffffff",
                borderRadius: "17px",
                boxShadow: 1,
                padding: 2,
                height: "550px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent
                sx={{
                  backgroundColor: "#ffffff",
                  padding: 0,
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MyMapComponent
                  zoom={zoom}
                  center={center}
                  vessels={vesselsToDisplay}
                  selectedVessel={selectedVessel}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Card for Table */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: "#ffffff",
                borderRadius: "17px",
                boxShadow: 1,
                padding: 2,
                height: "550px",
              }}
            >
              <CardContent
                sx={{
                  backgroundColor: "#ffffff",
                  padding: 0,
                  height: "100%",
                }}
              >
                <VesselDetailsTable
                  key={refreshKey}
                  vessels={vessels}
                  onRowClick={handleRowClick}
                  highlightRow={highlightRow}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {/* Conditionally render Pie Chart */}
        {vessels.length > 0 && (
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '500px', padding: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                  <PieChartComponent data={pieChartData} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '500px', padding: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <BarChartComponent data={barChartData} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        <br></br>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboardcopy;
