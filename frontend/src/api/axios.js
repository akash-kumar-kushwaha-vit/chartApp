import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:4000/api" : "https://helloapp-dcrh.onrender.com/api",
  withCredentials: true, // IMPORTANT: Allows cookies (JWT) to be sent with requests
});
