// src/services/api.js
import axios from "axios";
 
const API_BASE_URL = "http://localhost:8000";
 
export const sendMessage = async (message, role) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, { message, role });
        return response.data;
    } catch (error) {
        console.error("Error sending message:", error);
        return { reply: "Failed to send message" };
    }
};
 
export const uploadFile = async (file, role) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(`${API_BASE_URL}/upload/${role}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        return { error: "Failed to upload file" };
    }
};
 
export const listFiles = async (role) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/list/${role}`);
        return response.data.files || [];
    } catch (error) {
        console.error("Error listing files:", error);
        return [];
    }
};