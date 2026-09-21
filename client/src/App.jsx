import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { LandingPage } from './components/landing/LandingPage.jsx';
import { RoomPage } from './components/room/RoomPage.jsx';
import { FloatingReactions } from './components/common/FloatingReactions.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <NotificationProvider>
          {/* Fullscreen Floating Reactions Layer */}
          <FloatingReactions />

          {/* Global Toast Notifications */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 3500,
              style: {
                background: '#181818',
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.7)'
              }
            }}
          />

          {/* Route Definitions */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/join/:roomCode" element={<LandingPage />} />
            <Route path="/room/:roomCode" element={<RoomPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}
