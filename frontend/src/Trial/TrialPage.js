import React, { useState } from "react";

const LocationPicker = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setErrorMessage(null);
        },
        (error) => {
          setErrorMessage(
            "Error getting your location. Please allow location access."
          );
        }
      );
    } else {
      setErrorMessage("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div>
      {errorMessage && <p>{errorMessage}</p>}
      {latitude && longitude ? (
        <div>
          <p>Latitude: {latitude}</p>
          <p>Longitude: {longitude}</p>
          {/* Use this data to display pickup stations or perform other actions */}
        </div>
      ) : (
        <button onClick={getLocation}>Get My Location</button>
      )}
    </div>
  );
};

export default LocationPicker;
