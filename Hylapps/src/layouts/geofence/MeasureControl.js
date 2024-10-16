import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MeasureControl.css'; // Import the custom CSS file

const MeasureControl = () => {
  const map = useMap();
  const [measuring, setMeasuring] = useState(false);
  const [distance, setDistance] = useState(0);
  const [finalDistance, setFinalDistance] = useState(null); // State to hold the final distance
  const polylineRef = useRef(null);
  const popupRef = useRef(null);
  const pointIconsRef = useRef([]); // To keep track of point icons

  useEffect(() => {
    if (!map) return;

    // Create the measure control
    L.Control.MeasureControl = L.Control.extend({
      statics: { TITLE: 'Measure distances' },
      options: { position: 'topleft' },
      onAdd: function () {
        const link = L.DomUtil.create('a', 'leaflet-control-measure');
        link.style.backgroundImage = 'url("/inactive.png")'; // Initial image
        link.style.width = '25px'; // Set width for the button
        link.style.height = '25px'; // Set height for the button
        link.style.backgroundSize = 'cover'; // Ensure the image covers the button
        link.title = 'Measure distances';
        
        // Event handler for click
        L.DomEvent.on(link, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          toggleMeasuring(link); // Pass link to toggleMeasuring
        });
        
        return link;
      }
    });

    const measureControl = new L.Control.MeasureControl();
    map.addControl(measureControl);

    // Toggle measuring
    const toggleMeasuring = (link) => {
      setMeasuring((prev) => {
        const newMeasuring = !prev;
        if (newMeasuring) {
          startMeasuring(link); // Pass link to startMeasuring
        } else {
          stopMeasuring(link); // Pass link to stopMeasuring
        }
        return newMeasuring;
      });
    };

    const startMeasuring = (link) => {
      console.log('Started measuring');
      polylineRef.current = new L.Polyline([], {
        color: 'red',
        weight: 2,
      }).addTo(map);

      setDistance(0); // Reset distance
      setFinalDistance(null); // Reset final distance
      map.on('click', addPoint); // Start listening for map clicks
      map.on('dblclick', () => stopMeasuring(link)); // Stop measuring on double click
      link.style.backgroundImage = 'url("/active.png")'; // Change to active image
      map.getContainer().classList.add('crosshair'); // Add crosshair class to map
    };

    const stopMeasuring = (link) => {
      console.log('Stopped measuring');
      if (polylineRef.current) {
        map.off('click', addPoint); // Stop listening to clicks
        map.off('dblclick', () => stopMeasuring(link)); // Remove double-click event listener
        link.style.backgroundImage = 'url("/inactive.png")'; // Change back to inactive image
        map.getContainer().classList.remove('crosshair'); // Remove crosshair class from map
      }
    };

    const addPoint = (e) => {
      const { latlng } = e;
      console.log('Point added:', latlng);

      if (polylineRef.current) {
        polylineRef.current.addLatLng(latlng); // Add point to polyline
        const latLngs = polylineRef.current.getLatLngs();
        console.log('All points in polyline:', latLngs);

        if (latLngs.length > 1) {
          let totalDistance = 0;
          for (let i = 1; i < latLngs.length; i++) {
            totalDistance += latLngs[i - 1].distanceTo(latLngs[i]); // Calculate distance between points
          }
          setDistance(totalDistance); // Set distance in meters
          console.log(`Total distance (meters): ${totalDistance}`);

          // Show the distance in a popup at the last point
          const distanceInKm = (totalDistance / 1000).toFixed(2);
          const distanceInMiles = (totalDistance * 0.000621371).toFixed(2); // Convert to miles
          console.log(`Distance: ${distanceInKm} km (${distanceInMiles} miles)`);

          const content = `Distance: ${distanceInKm} km (${distanceInMiles} miles)`;

          if (popupRef.current) {
            popupRef.current.setLatLng(latlng).setContent(content).openOn(map);
          } else {
            popupRef.current = L.popup().setLatLng(latlng).setContent(content).openOn(map); // Create and show the popup
          }
        }

        // Add point icon at the clicked location
        const pointIcon = L.marker(latlng, {
          icon: L.divIcon({
            className: 'leaflet-point-icon', // Custom class for point icon
            html: '<div class="point-icon"></div>', // Custom HTML for the icon
            iconSize: [10, 10], // Size of the icon
          })
        }).addTo(map);

        pointIconsRef.current.push(pointIcon); // Store reference to the point icon
      }
    };

    const clearPoints = () => {
      // Remove all point icons from the map
      pointIconsRef.current.forEach(icon => map.removeLayer(icon));
      pointIconsRef.current = []; // Clear the array
    };

    return () => {
      map.removeControl(measureControl); // Cleanup on unmount
      map.off('click', addPoint); // Remove event listener
      map.off('dblclick', () => stopMeasuring(link)); // Remove double-click listener
      clearPoints(); // Clean up point icons on unmount
      // Clear the polyline if the component unmounts, i.e., page reloads
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null; // Clear the polyline reference
      }
      if (popupRef.current) {
        map.removeLayer(popupRef.current);
        popupRef.current = null; // Clear the popup reference
      }
    };
  }, [map]);

  return (
    <div className="leaflet-measure-info">
      {measuring && (
        <p>
          {distance > 0 ? `Total Distance: ${(distance / 1000).toFixed(2)} km` : 'Click to start measuring'}
        </p>
      )}
      {finalDistance && (
        <p>
          Final Distance: {finalDistance} km
        </p>
      )}
    </div>
  );
};

export default MeasureControl;
