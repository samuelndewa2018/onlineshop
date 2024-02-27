// CreateCountry.js
import React, { useState } from "react";
import axios from "axios";

const CreateCountry = () => {
  const [countryName, setCountryName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${server}/country/countries`, {
        name: countryName,
      });
      toast.success("Country created successfully");
      console.log("Country created successfully");
    } catch (error) {
      console.error("Error creating country:", error);
    }
  };

  return (
    <div>
      <h2>Create Country</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Country Name:
          <input
            type="text"
            value={countryName}
            onChange={(e) => setCountryName(e.target.value)}
          />
        </label>
        <button type="submit">Create Country</button>
      </form>
    </div>
  );
};

export default CreateCountry;
