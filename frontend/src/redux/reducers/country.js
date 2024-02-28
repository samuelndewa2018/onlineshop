import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
};

export const countryReducer = createReducer(initialState, {
  countryCreateRequest: (state) => {
    state.isLoading = true;
  },
  countryCreateSuccess: (state, action) => {
    state.isLoading = false;
    state.event = action.payload;
    state.success = true;
  },
  countryCreateFail: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.success = false;
  },

  // get all events of shop

  // get all events
  getAllcountriesRequest: (state) => {
    state.isLoading = true;
  },
  getAllcountriesSuccess: (state, action) => {
    state.isLoading = false;
    state.allEvents = action.payload;
  },
  getAllcountriesFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },

  clearErrors: (state) => {
    state.error = null;
  },
});
