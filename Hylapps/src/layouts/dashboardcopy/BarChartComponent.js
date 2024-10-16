import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import axios from "axios"; // Make sure to import axios
import './BarChart.css'; // Import the CSS for styling

function BarChartComponent() {
  const chartRef = useRef(null);
  const [data, setData] = useState([]); // State to hold chart data

  const downloadChart = () => {
    const link = document.createElement("a");
    link.href = chartRef.current.chart.toBase64Image();
    link.download = "barchart.png";
    link.click();
  };

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;

    const fetchData = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/get-tracked-vessels`);
        const vessels = response.data; // Assuming your API returns an array of vessel documents

        // Array of months and initialize counts to 0
        const months = [
          "January", "February", "March", "April",
          "May", "June", "July", "August",
          "September", "October", "November", "December"
        ];
        
        const vesselCountByMonth = months.map(month => ({ month, count: 0 }));

        vessels.forEach(vessel => {
          const monthIndex = new Date(vessel.AIS.TIMESTAMP).getMonth(); // Get the month index (0-11)
          vesselCountByMonth[monthIndex].count++; // Increment the count for the respective month
        });

        setData(vesselCountByMonth); // Set data to state
      } catch (error) {
        console.error("Error fetching tracked vessels:", error);
      }
    };

    fetchData();

    return () => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d"); // Ensure chartRef is not null

    // Clean up previous instance of chart
    if (chartRef.current?.chart) {
      chartRef.current.chart.destroy();
    }

    if (ctx && data.length > 0) {
      // Initialize the new chart
      chartRef.current.chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.map(d => d.month), // Use months as labels
          datasets: [
            {
              label: "Total Vessels", // Single label for total vessels
              data: data.map(d => d.count), // Total count of vessels per month
              backgroundColor: "rgba(75, 192, 192, 0.6)", // Chart color
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true, // Make chart responsive to different devices
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 5 // Set step size to 5
              }
            },
            x: {
              title: {
                display: true,
                text: 'Months' // Set title for the x-axis
              },
              ticks: {
                autoSkip: false // Show all ticks (month names)
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom', // Position legend below the chart
            }
          }
        }
      });
    }

    // Cleanup function to destroy chart on component unmount
    return () => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.destroy();
      }
    };
  }, [data]);

  return (
    <div className="chart-container-wrapper">
      <div className="chart-header">
        <h4 style={{ color: "#344767" }}>Total Ships Tracked <sup style={{color:"orange", fontSize:" 12px"}}>(Based on Months)</sup></h4>
        <button className="download-btn" onClick={downloadChart}>
          <i className="fa fa-download"></i>&nbsp;Download
        </button>
      </div>
      <div className="chart-container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

export default BarChartComponent;
