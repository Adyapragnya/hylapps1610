import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaPause, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import './Timeline.css';
import axios from 'axios'; // Import axios for making API requests

const Timeline = ({ initialEvents, fetchNewEvent, selectedVessel }) => {
    const [events, setEvents] = useState(initialEvents); // Initialize with initialEvents
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [alerts, setAlerts] = useState([]); // State to store alerts from the API

    // Fetch alerts from the backend and filter them based on selected vessel's name
    useEffect(() => {
        const fetchAlerts = async () => {
            try {

                const baseURL = process.env.REACT_APP_API_BASE_URL;
               
                const response = await axios.get(`${baseURL}/api/alerts/`); // Replace with your API endpoint
                const allAlerts = response.data;

                if (selectedVessel && selectedVessel.AIS && selectedVessel.AIS.NAME) {
                    const vesselName = selectedVessel.AIS.NAME;

                    // Filter alerts based on vesselSelected field
                    const filteredAlerts = allAlerts.filter(alert =>
                        alert.vesselSelected.includes(vesselName)
                    );

                    console.log('Filtered Alerts:', filteredAlerts);
                    setAlerts(filteredAlerts);
                }
            } catch (error) {
                console.error('Error fetching alerts:', error);
            }
        };

        fetchAlerts(); // Fetch alerts when the component mounts or when the selected vessel changes
    }, [selectedVessel]);

    // Function to go to the next event
    const nextEvent = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
    };

    // Function to go to the previous event
    const prevEvent = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length);
    };

    const playSlideshow = () => {
        if (!isPlaying) {
            const id = setInterval(nextEvent, 2000); // Move to the next event every 2 seconds
            setIntervalId(id);
            setIsPlaying(true);
        }
    };

    const stopSlideshow = () => {
        clearInterval(intervalId);
        setIsPlaying(false);
    };

    useEffect(() => {
        console.log(selectedVessel); // Log the current vessel
    }, [selectedVessel]);

    // Clear interval on unmount or when intervalId changes
    useEffect(() => {
        return () => clearInterval(intervalId);
    }, [intervalId]);

    // Poll for new events every 5 seconds (or any interval)
    useEffect(() => {
        const pollForNewEvents = async () => {
            const newEvent = await fetchNewEvent(); // Fetch new event from the function passed as a prop

            // If new event exists and is not a duplicate, add it to the timeline
            if (newEvent && !events.some(event => event.id === newEvent.id)) {
                setEvents((prevEvents) => [...prevEvents, newEvent]);
            }
        };

        // Poll every 5 seconds for new events
        const pollInterval = setInterval(pollForNewEvents, 5000); // Adjust time as necessary

        return () => clearInterval(pollInterval); // Clean up on unmount
    }, [events, fetchNewEvent]);

    return (
        <div className="timeline" style={{height:"100px",paddingTop:"5px"}}>
            <div className="timeline-controls" style={{ marginTop: "-50px" }}>
                <button onClick={prevEvent} disabled={isPlaying} title="Previous">
                    <FaChevronLeft />
                </button>
                <button onClick={nextEvent} disabled={isPlaying} title="Next">
                    <FaChevronRight />
                </button>
                <button onClick={isPlaying ? stopSlideshow : playSlideshow} title={isPlaying ? 'Stop' : 'Play'}>
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
            </div>

            {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                    <div key={index} className="timeline-item" style={{ opacity: currentIndex === index ? 1 : 0.5, marginTop: "-5px" }}>
                        <div className="timeline-marker" />
                        <div className="timeline-content">
                            <h3 className="timeline-title">{alert.geofence}</h3>
                            {/* <span className="timeline-date">Message: {alert.message} </span> */}
                            {/* {/* <span className="timeline-date"> From: {alert.fromDate}</span> */}
                            <span className="timeline-date"> {alert.toDate}</span>
                            {/* <span className="timeline-date">{new Date(alert.createdAt).toLocaleString()}</span> */}
                        </div>
                    </div>
                ))
            ) : (
                <p>No alerts for the selected vessel.</p>
            )}
        </div>
    );
};

Timeline.propTypes = {
    selectedVessel: PropTypes.shape({
        AIS: PropTypes.shape({
            NAME: PropTypes.string.isRequired
        }).isRequired
    }),
    initialEvents: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            date: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
    fetchNewEvent: PropTypes.func.isRequired, // Function to fetch new event
};

export default Timeline;
