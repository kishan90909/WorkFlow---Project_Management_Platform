import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("workflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Axios inherits the instance-level JSON header for FormData requests unless
  // it is removed. Multer needs the browser-generated multipart boundary.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("workflow_token");
      localStorage.removeItem("workflow_user");
      if (!window.location.pathname.startsWith("/login"))
        window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
