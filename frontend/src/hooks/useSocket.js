// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import socketService from '@/services/socketService';

export function useSocket(eventHandlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    // connect if not already
    if (!socketRef.current) {
      socketRef.current = socketService.getSocket(); // returns existing or new socket
    }
    const socket = socketRef.current;

    // register handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // cleanup handlers on unmount
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [eventHandlers]);

  return socketRef.current;
}
