export const baseUrl = () =>
  process.env.BASE_URL
    ? process.env.BASE_URL
    : process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://www.ninetyone.co.ke";
//for purpose of upload
