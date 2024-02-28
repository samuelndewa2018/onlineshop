// src/components/CityForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { server } from "../../server";

const CityForm = () => {
  const [name, setName] = useState("");
  const [stateId, setStateId] = useState("");
  const [states, setStates] = useState([]);

  useEffect(() => {
    // Fetch states from the backend when the component mounts
    const fetchStates = async () => {
      try {
        const response = await axios.get(`${server}/states`);
        setStates(response.data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };

    fetchStates();
  }, []); // Empty dependency array to run the effect only once when the component mounts

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${server}/cities/create-city`, {
        name,
        stateId,
      });
      setName("");
      setStateId("");
      alert("City created successfully");
    } catch (error) {
      console.error("Error creating city:", error);
    }
  };

  return (
    <div>
      <h2>Create City</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="City Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={stateId} onChange={(e) => setStateId(e.target.value)}>
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state._id} value={state._id}>
              {state.name}
            </option>
          ))}
        </select>
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default CityForm;
