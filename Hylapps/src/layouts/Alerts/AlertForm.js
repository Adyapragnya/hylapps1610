import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Select from 'react-select'; // Importing react-select
import './AlertForm.css';
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
const AlertForm = ({ vessels}) => {
  const navigate = useNavigate();
  const [geofence, setGeofence] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [message, setMessage] = useState('');
  const [attachToVessel, setAttachToVessel] = useState(false);
  const [vesselSelected, setVesselSelected] = useState([]); // Updated to store multiple vessels
  const [whatsapp, setWhatsApp] = useState(false);
  const [email, setEmail] = useState(false);

  const [geofenceOptions, setGeofenceOptions] = useState([]);
  const [vesselOptions, setVesselOptions] = useState([]);

  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const baseURL = process.env.REACT_APP_API_BASE_URL;

        const [circleResponse, polygonResponse] = await Promise.all([
          fetch(`${baseURL}/api/circlegeofences`),
          fetch(`${baseURL}/api/polygongeofences`),
       
        ]);

        if (!circleResponse.ok || !polygonResponse.ok ) {
          throw new Error('Failed to fetch geofences');
        }

        const circleGeofences = await circleResponse.json();
        const polygonGeofences = await polygonResponse.json();
       

        const combinedGeofences = [
          ...circleGeofences.map(g => ({ id: g._id, name: g.geofenceName, type: 'Circle' })),
          ...polygonGeofences.map(g => ({ id: g._id, name: g.geofenceName, type: 'Polygon' })),
         
        ];

        setGeofenceOptions(combinedGeofences);
      } catch (error) {
        console.error('Error fetching geofences:', error);
        Swal.fire('Error', 'Failed to fetch geofences.', 'error');
      }
    };

    const fetchVessels = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/get-tracked-vessels`);
        if (!response.ok) {
          throw new Error('Failed to fetch vessels');
        }

        const vessels = await response.json();
        const vesselOptions = vessels.map(v => ({
          value: v.AIS.NAME,
          label: `${v.AIS.NAME} | ${v.SpireTransportType}`,
        }));
        setVesselOptions(vesselOptions);
      } catch (error) {
        console.error('Error fetching vessels:', error);
        Swal.fire('Error', 'Failed to fetch vessels.', 'error');
      }
    };

    fetchGeofences();
    fetchVessels();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!geofence) {
      return Swal.fire('Error', 'Please select a Geofence name.', 'error');
    }
    if (!fromDate || !toDate) {
      return Swal.fire('Error', 'Please fill in both From Date and To Date.', 'error');
    }
    if (!message) {
      return Swal.fire('Error', 'Please enter a message.', 'error');
    }
    
  
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to save this alert?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'No, cancel!'
    });
  
    if (result.isConfirmed) {
      // Prepare the data to send
      const alertData = {
        geofence,
        fromDate,
        toDate,
        message,
        attachToVessel,
        vesselSelected: vesselSelected.map(v => v.value), // Get only the value of the selected vessels
        whatsapp,
        email,
       
      };
  
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/alerts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertData),
        });
  
        if (!response.ok) {
          throw new Error('Failed to save alert');
        }
  
        Swal.fire('Saved!', 'Your alert has been saved.', 'success');
        // Optionally reset the form here after successful submission
   
      } catch (error) {
        console.error('Error saving alert:', error);
        Swal.fire('Error', 'Failed to save alert. Please try again.', 'error');
      }
    }
  };
  

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to cancel?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, go back!'
    });

    if (result.isConfirmed) {
      setGeofence('');
      setFromDate('');
      setToDate('');
      setMessage('');
      setAttachToVessel(false);
      setVesselSelected([]); // Reset to an empty array
      setWhatsApp(false);
      setEmail(false);
     

      Swal.fire('Cancelled!', 'Your action has been cancelled.', 'info');
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!attachToVessel) {
      // When 'Attach to Vessel' is set to 'No', select all vessels
      setVesselSelected(vesselOptions);
    } else {
      // Clear selected vessels if 'Attach to Vessel' is set to 'Yes'
      setVesselSelected([]);
    }
  }, [attachToVessel, vesselOptions]);

  return (
    <div className="alert-form-container">
      <form className="alert-form" onSubmit={handleSubmit}>
        <h2 className="text-center" style={{ color: "#0F67B1" }}>Create Alerts</h2>
        <hr />

        <div className="form-row">
          <label>
            Geofence Name:
            <select value={geofence} onChange={(e) => setGeofence(e.target.value)}>
              <option value="">Select Geofence</option>
              {geofenceOptions.map((g) => (
                <option key={g.id} value={`${g.name} | ${g.type}`}>
                {g.name} | {g.type}
              </option>
              ))}
            </select>
          </label>
        </div>

        <div className="date-range">
          <label>
            From Date:
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              min={getTodayDate()}
            />
          </label>
          <label>
            To Date:
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || getTodayDate()}
            />
          </label>
        </div>

        <div>
          <label>
            Message:
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
            />
          </label>
        </div>

        <div className="row">
          <label>
            Attach to Vessel:
            <select
              value={attachToVessel ? 'yes' : 'no'}
              onChange={(e) => setAttachToVessel(e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>

          {attachToVessel && (
            <label>
              Select Vessel(s):
              <Select
                isMulti
                options={vesselOptions}
                value={vesselSelected}
                onChange={(selectedOptions) => setVesselSelected(selectedOptions)}
              />
            </label>
          )}
        </div>

     

        <div className="alert-type-checkboxes">
          <label>Alert Type:</label>
          <div className="checkbox-group">
            {/* <label className="checkbox-wrapper-46">
              <input
                type="checkbox"
                className="inp-cbx"
                checked={whatsapp}
                onChange={(e) => setWhatsApp(e.target.checked)}
              />
              <div className="cbx">
                <span className="cbx-span"></span>&nbsp;&nbsp;
                <span>WhatsApp</span>
              </div>
            </label> */}

            <label className="checkbox-wrapper-46">
              <input
                type="checkbox"
                className="inp-cbx"
                checked={email}
                onChange={(e) => setEmail(e.target.checked)}
              />
              <div className="cbx">
                <span className="cbx-span"></span>&nbsp;&nbsp;
                <span>Email</span>
              </div>
            </label>
          </div>
        </div>

        <div className="button-group">
          <button type="submit">Save Alert</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

AlertForm.propTypes = {
  vessels: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      name: PropTypes.string,
      imo: PropTypes.number,
      heading: PropTypes.number,
      eta: PropTypes.string,
      destination: PropTypes.string,
    }).isRequired
  ).isRequired
};
export default AlertForm;


