import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const createCustomIcon = (heading) => {
  const iconUrl = '/ship-popup.png'; // Custom ship icon URL
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="transform: rotate(${heading}deg);"><img src="${iconUrl}" style="width: 12px; height: 12px;" /></div>`,
    iconSize: [15, 15],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const createPointIcon = () => {
  return L.divIcon({
    className: 'point-icon',
    html: `<div style="width: 5px; height: 5px; background-color: red; border-radius: 50%;"></div>`,
    iconSize: [15, 15],
    // iconAnchor: [10, 10]
  });
};

const MapWithMarkers = ({ vessels, selectedVessel }) => {
  const map = useMap();
  const markerClusterGroupRef = useRef(null);
  const markerRef = useRef();

  useEffect(() => {
    if (map) {
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
      } else {
        markerClusterGroupRef.current = L.markerClusterGroup();
        map.addLayer(markerClusterGroupRef.current);
      }

      vessels.forEach(vessel => {
        if (vessel.lat !== undefined && vessel.lng !== undefined) {
          const marker = L.marker([vessel.lat, vessel.lng], {
            icon: selectedVessel && vessel.name === selectedVessel.name
              ? createCustomIcon(vessel.heading)
              : createPointIcon()
          });

          marker.bindPopup(`
            <strong>Name:</strong> ${vessel.name || 'No name'}<br />
            <strong>IMO:</strong> ${vessel.imo || 'N/A'}<br />
            <strong>Heading:</strong> ${vessel.heading || 'N/A'}<br />
            <strong>ETA:</strong> ${vessel.eta || 'N/A'}<br />
            <strong>Destination:</strong> ${vessel.destination || 'N/A'}
            <div style="text-align: right;">
              <a href="/dashboard/${vessel.name}" style="cursor: pointer;">
                <u>++View more</u>
              </a>
            </div>
          `);

          markerClusterGroupRef.current.addLayer(marker);
        } else {
          console.error(`Invalid coordinates for vessel: ${JSON.stringify(vessel)}`);
        }
      });

      markerClusterGroupRef.current.on('clustermouseover', (event) => {
        const cluster = event.layer;
        const vesselCount = cluster.getAllChildMarkers().length;
        cluster.bindPopup(`
          <div>
            <strong>Vessels in the area:</strong> ${vesselCount}
          </div>
        `).openPopup();
      });

      if (selectedVessel) {
        if (markerRef.current) {
          markerRef.current.remove();
        }

        const customIcon = createCustomIcon(selectedVessel.heading);

        markerRef.current = L.marker([selectedVessel.lat, selectedVessel.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div>
              Name: ${selectedVessel.name}<br />
            
            </div></br>
            <div style="text-align: right;">
              <a href="/dashboard/${selectedVessel.name}" style="cursor: pointer;">
                <u>++View more</u>
              </a>
            </div>
          `)
          .openPopup();

        map.flyTo([selectedVessel.lat, selectedVessel.lng], 10, {
          animate: true,
          duration: 1
        });
      }
    }
  }, [map, vessels, selectedVessel]);

  return null;
};

MapWithMarkers.propTypes = {
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
  ).isRequired,
  selectedVessel: PropTypes.shape({
    name: PropTypes.string.isRequired,
    imo: PropTypes.number,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    heading: PropTypes.number,
  })
};

export default MapWithMarkers;
