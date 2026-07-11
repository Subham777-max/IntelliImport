import axios from "axios";

export const api = axios.create({
  baseURL: "https://intelliimport.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});