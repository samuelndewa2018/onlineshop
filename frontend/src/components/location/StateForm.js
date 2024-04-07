import React, { useState, useEffect } from "react";
import axios from "axios";

const StateForm = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [countryId, setCountryId] = useState("");
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // Fetch countries from the backend when the component mounts
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`${server}/countries`);
        setCountries(response.data);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []); // Empty dependency array to run the effect only once when the component mounts

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${server}/states/create-state`, {
        name,
        price, // Include price in the request body
        countryId,
      });
      setName("");
      setPrice(""); // Reset price field after submission
      setCountryId("");
      alert("State created successfully");
    } catch (error) {
      console.error("Error creating state:", error);
    }
  };

  return (
    <div>
      <h2>Create State</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="State Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <select
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country._id} value={country._id}>
              {country.name}
            </option>
          ))}
        </select>
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default StateForm;
