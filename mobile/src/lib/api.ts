import axios from 'axios';
import { io } from 'socket.io-client';

export const API_URL = 'https://noordrive-api.onrender.com/api';
export const SOCKET_URL = 'https://noordrive-api.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
});

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
