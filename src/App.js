import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoiYnJvd24yMDE4IiwiYSI6ImNtMmZwcHdpcTBlM3Yya3F5YTdqejBocTcifQ.15ZpuEvFbrt5k1sPy9xLOw';

const MultiApiMap = () => {
  const [hazards, setHazards] = useState([]);
  const [countryClimate, setCountryClimate] = useState([]);
  const [countryInfo, setCountryInfo] = useState([]);
  const [foodSecurity, setFoodSecurity] = useState(null);
  const [ipcPeaks, setIpcPeaks] = useState([]);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [center, setCenter] = useState([-19.8, 65.88]); // Initial center [lng, lat]
  const [zoom, setZoom] = useState(6);         // Initial zoom level

  // Fetch all APIs concurrently
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [hazardsData, climateData, countryInfoData, foodSecurityData, ipcPeaksData] = await Promise.all([
          axios.get('https://api.hungermapdata.org/v1/climate/hazards'),
          axios.get('https://api.hungermapdata.org/v2/climate/country'),
          axios.get('https://api.hungermapdata.org/v2/info/country'),
          axios.get('https://api.hungermapdata.org/v1/foodsecurity/country/AFG'),
          axios.get('https://api.hungermapdata.org/v1/ipc/peaks'),
        ]);

        console.log(hazardsData.data.body.hazards);
        console.log(climateData.data.body);
        console.log(countryInfoData.data.body);
        console.log(foodSecurityData.data.body);
        console.log(ipcPeaksData.data.body);


        setHazards(hazardsData.data.body?.hazards || []);  // Safely access hazards
        setCountryClimate(climateData.data.body || []);     // Safely access climate data
        setCountryInfo(countryInfoData.data.body?.countries || []); // Safely access country info
        setFoodSecurity(foodSecurityData.data.body || {});  // Safely access food security data
        setIpcPeaks(ipcPeaksData.data.body?.peaks || []); 
      } catch (err) {
        setError('Failed to fetch data from one or more APIs.');
      }
    };

    fetchAllData();
  }, []);

  // Initialize Mapbox map
  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/brown2018/cm2foggyc00bd01ph7vkqai88',
      center: center,
      zoom: zoom
    });

    // Clean up on component unmount
    return () => mapRef.current.remove();
  }, []);
// Add markers for hazards and other data
useEffect(() => {
  if (hazards.length > 0 && mapRef.current) {
    hazards.forEach(hazard => {
      const { lat, lon } = hazard.location || {};
      if (lat && lon && !isNaN(lat) && !isNaN(lon) && typeof lat === 'number' && typeof lon === 'number') {
        new mapboxgl.Marker({ color: 'red' })
          .setLngLat([lon, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <h4>${hazard.hazard_type}</h4>
            <p><strong>Severity:</strong> ${hazard.severity}</p>
            <p><strong>Description:</strong> ${hazard.description || 'N/A'}</p>
          `))
          .addTo(mapRef.current);
      } else {
        console.error('Invalid hazard location:', hazard.location);
      }
    });
  }

  // Add IPC Peaks as markers
  if (ipcPeaks.length > 0 && mapRef.current) {
    ipcPeaks.forEach(peak => {
      const { lat, lon } = peak.location || {};
      if (lat && lon && !isNaN(lat) && !isNaN(lon) && typeof lat === 'number' && typeof lon === 'number') {
        new mapboxgl.Marker({ color: 'blue' })
          .setLngLat([lon, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <h4>IPC Peak</h4>
            <p><strong>Peak Level:</strong> ${peak.level}</p>
          `))
          .addTo(mapRef.current);
      } else {
        console.error('Invalid IPC peak location:', peak.location);
      }
    });
  }

  // Add country info as markers
  if (countryInfo.length > 0 && mapRef.current) {
    countryInfo.forEach(country => {
      const { lat, lon } = country.country || {};
      if (lat && lon && !isNaN(lat) && !isNaN(lon) && typeof lat === 'number' && typeof lon === 'number') {
        new mapboxgl.Marker({ color: 'green' })
          .setLngLat([lon, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <h4>${country.country.name}</h4>
            <p><strong>ISO Code:</strong> ${country.country.iso3}</p>
            <p><strong>Population:</strong> ${country.population}</p>
          `))
          .addTo(mapRef.current);
      } else {
        console.error('Invalid country location:', country.country);
      }
    });
  }

  // Add food security data for Afghanistan
  if (foodSecurity && foodSecurity.country && mapRef.current) {
    const { country } = foodSecurity;
    const { lat, lon } = country || {};
    if (lat && lon && !isNaN(lat) && !isNaN(lon) && typeof lat === 'number' && typeof lon === 'number') {
      new mapboxgl.Marker({ color: 'yellow' })
        .setLngLat([lon, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <h4>Food Security in ${country.name}</h4>
          <p><strong>Year:</strong> ${foodSecurity.year}</p>
          <p><strong>Severity:</strong> ${foodSecurity.severity}</p>
        `))
        .addTo(mapRef.current);
    } else {
      console.error('Invalid food security location:', country);
    }
  }
}, [hazards, countryClimate, countryInfo, foodSecurity, ipcPeaks]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div> 
      <div className="sidebar">
    Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
  </div>
      <div ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />
    </div>
  );
};

export default MultiApiMap;
