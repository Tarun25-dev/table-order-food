import { useState } from "react";
import {Routes, Route} from "react-router";
import Payment from "./components/Payment";
import App1 from "./App1";
import Gallery from "./components/Gallery";
import Preloader from "./components/Preloader";
import App2 from "./App2";
import Admin from "./components/Admin";
import AdminPortal from "./components/AdminDashboard";
import { NotificationProvider } from "./context/NotificationContext";


export default function App(){
  const [showLoader, setShowLoader] = useState(true);

  return(
    <>
    <NotificationProvider>
    {showLoader && (<Preloader onLoaded={() => setShowLoader(false)} />)}
    <Routes>
          <Route path="/" element={<App1 />}/>
          <Route path="/admin" element={<Admin />}/>
          <Route path="/admin/dashboard" element={<AdminPortal />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/table/:tableId" element={<Restaurant />} />
          <Route path="/table/:tableId/payment" element={<Payment />} />
    </Routes>
    </NotificationProvider>
    </>
  );
}

function Restaurant(){
  return(
    <>
    <App2 />
    </>
  );
}

