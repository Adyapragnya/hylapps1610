import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import './MyMapComponent.css'; // Ensure you have relevant styles here


const createCustomIcon = (heading) => {
  const iconUrl = '/ship-popup.png';

  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="transform: rotate(${heading}deg);"><img src="${iconUrl}" style="width: 12px; height: 12px;" /></div>`,
    iconSize: [10, 10],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const MyMapComponent = ({ selectedVessel, style }) => {
  const mapRef = useRef(null);
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    axios
      .get(`${baseURL}/api/get-tracked-vessels`)
      .then((response) => {
        const formattedData = response.data; // Ensure the response is in the correct format
        setVessels(formattedData);
      })
      .catch((err) => {
        console.error("Error fetching vessel data:", err);
      });
  }, []);

  useEffect(() => {
    if (mapRef.current && selectedVessel) {
      const { LATITUDE, LONGITUDE } = selectedVessel.AIS;
      const map = mapRef.current;

      // Smoothly pan to the new position
      map.flyTo([LATITUDE, LONGITUDE], 8, {
        duration: 1.5 // Adjust the duration for smoothness
      });
    }
  }, [selectedVessel]);

  const position = selectedVessel ? [selectedVessel.AIS.LATITUDE, selectedVessel.AIS.LONGITUDE] : [0, 0];
  const zoom = selectedVessel ? 7 : 2; // Zoom out when no vessel is selected

  return (
    <div className="map-timeline-container">
      {selectedVessel ? (
        <div className="vessel-info">
          <h4>Voyage Details</h4>
          <table className="voyage-table">
            <tbody>
          
              <tr>
                <td>Departure Port:</td>
                <td>{selectedVessel.AIS.DESTINATION || 'N/A'}</td>
              </tr>
              <tr>
                <td>Arrival Port:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Arrival Date:</td>
                <td>{selectedVessel.AIS.ETA || 'N/A'}</td>
              </tr>
              <tr>
                <td>Actual Arrival Date:</td>
                <td>{selectedVessel.AIS.ETA || 'N/A'}</td>
              </tr>
              <tr>
                <td>Voyage Duration:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Cargo Type:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Quantity:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Unit:</td>
                <td>N/A</td>
              </tr>
             
            </tbody>
          </table>
        </div>
      ) : null}
     <div className="map-card" style={{ flex: '1', ...style }}>
          <div className="card" style={{ borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', overflow: 'hidden' }}>
            <MapContainer
              center={[0, 0]}
              minZoom={1.5}
              zoom={1.5}
              maxZoom={18}
              maxBounds={[[85, -180], [-85, 180]]} // Strict world bounds to prevent panning
              maxBoundsViscosity={8} // Makes the map rigid
              style={{ height: '567px', width: '100%', backgroundColor: 'rgba(170,211,223,255)' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" noWrap={true} />
              {selectedVessel && (
                <Marker
                  position={[selectedVessel.AIS.LATITUDE, selectedVessel.AIS.LONGITUDE]}
                  icon={createCustomIcon(selectedVessel.AIS.HEADING)}
                >
                  <Popup>
                    Name: {selectedVessel.AIS.NAME || 'No name'}<br />
                    IMO: {selectedVessel.AIS.IMO || 'N/A'}<br />
                    Heading: {selectedVessel.AIS.HEADING || 'N/A'}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
      </div>

    </div>
  );
};

MyMapComponent.propTypes = {
  selectedVessel: PropTypes.shape({
    AIS: PropTypes.shape({
      NAME: PropTypes.string,
      IMO: PropTypes.string,
      CALLSIGN: PropTypes.string,
      DESTINATION: PropTypes.string,
      LATITUDE: PropTypes.number,
      LONGITUDE: PropTypes.number,
      HEADING: PropTypes.number,
      ETA: PropTypes.string,
    })
  }),
  style: PropTypes.object,
};

export default MyMapComponent;
