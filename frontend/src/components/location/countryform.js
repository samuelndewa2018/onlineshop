// src/components/CountryForm.js
import React, { useState } from "react";
import axios from "axios";
import { server } from "../../server";

const CountryForm = () => {
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("this is the ", name);
    try {
      await axios.post(`${server}/countries/create-country`, {
        name,
      });
      setName("");
      alert("Country created successfully");
    } catch (error) {
      console.error("Error creating country:", error);
    }
  };

  return (
    <div>
      <h2>Create Country</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Country Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default CountryForm;
