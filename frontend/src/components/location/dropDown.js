import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getAllCountries } from "./redux/actions/country";
import { server } from "../../server";

const LocationForm = () => {
  const dispatch = useDispatch();
  const countries = useSelector((state) => state.countries); // Assuming your Redux store has a 'countries' slice

  const [selectedCountry, setSelectedCountry] = useState("");
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    dispatch(getAllCountries()); // Dispatch the getAllCountries action when the component mounts
  }, [dispatch]);

  // Fetch states based on the selected country
  useEffect(() => {
    const fetchStates = async () => {
      if (selectedCountry) {
        try {
          const response = await axios.get(
            `${server}/states/${selectedCountry}`
          );
          setStates(response.data);
        } catch (error) {
          console.error("Error fetching states:", error);
        }
      }
    };
    fetchStates();
  }, [selectedCountry]);

  // Fetch cities based on the selected state
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState) {
        try {
          const response = await axios.get(`${server}/cities/${selectedState}`);
          setCities(response.data);
        } catch (error) {
          console.error("Error fetching cities:", error);
        }
      }
    };
    fetchCities();
  }, [selectedState]);

  // Fetch price based on the selected state
  useEffect(() => {
    const fetchPrice = async () => {
      if (selectedState) {
        try {
          const response = await axios.get(
            `${server}/states/price/${selectedState}`
          );
          setPrice(response.data.price);
        } catch (error) {
          console.error("Error fetching price:", error);
        }
      }
    };
    fetchPrice();
  }, [selectedState]);

  return (
    <div>
      <h2>Select Location</h2>
      <div>
        <label>Country:</label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country._id} value={country._id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>State:</label>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state._id} value={state._id}>
              {state.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>City:</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="">Select City</option>
          {cities.map((city) => (
            <option key={city._id} value={city._id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Price:</label>
        <span>{price}</span>
      </div>
      <div>
        <label>State:</label>
        <span>{selectedState}</span>
      </div>
    </div>
  );
};

export default LocationForm;
