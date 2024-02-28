import axios from "axios";

const server = "http://localhost:5000";
// create event
export const createcountry = (name) => async (dispatch) => {
  try {
    dispatch({
      type: "eventCreateRequest",
    });

    const { d } = await axios.post(
      `${server}/api/countries/create-country`,
      name
    );
    dispatch({
      type: "countryCreateSuccess",
      payload: d.country,
    });
  } catch (error) {
    dispatch({
      type: "countryCreateFail",
      payload: error.response.data.message,
    });
  }
};

// get all events
export const getAllCountries = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllcountriesRequest",
    });

    const { data } = await axios.get(`${server}/api/countries/`);
    dispatch({
      type: "getAllcountriesSuccess",
      payload: data.countries,
    });
  } catch (error) {
    dispatch({
      type: "getAllcountriesFailed",
      payload: error.response.data.message,
    });
  }
};
