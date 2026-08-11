import axios from 'axios';
import { io } from 'socket.io-client';

export const API_URL = 'http://localhost:3001/api';
export const SOCKET_URL = 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
});

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
