import axios from "axios";

export async function login(credentials) {
  const response = await axios.post("/api/auth/login", credentials);
  return response.data;
}

export async function logout() {
  await axios.post("/api/auth/logout");
}

export async function getCurrentUser() {
  const response = await axios.get("/api/auth/me");
  return response.data.user;
}
