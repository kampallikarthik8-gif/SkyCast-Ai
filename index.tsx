
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize Native Mobile Features
const initNativeFeatures = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Configure Status Bar for dark theme
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
      
      // Hide Splash Screen once the app is ready
      await SplashScreen.hide();
    } catch (e) {
      console.warn('Capacitor plugin initialization failed', e);
    }
  }
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

initNativeFeatures();
