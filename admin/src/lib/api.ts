import axios from 'axios';
import { io } from 'socket.io-client';

export const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://srv-d9tp5ajncjis739pf21g.onrender.com/api';
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://srv-d9tp5ajncjis739pf21g.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
});

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
