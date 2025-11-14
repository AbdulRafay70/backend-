import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Bed, MapPin, Truck, Plane, Coffee, User as UserIcon } from "lucide-react";
import HotelSection from "../../components/HotelSection";
import ZiyaratSection from "../../components/ZiyaratSection";
import TransportSection from "../../components/TransportSection";
import AirportSection from "../../components/AirportSection";
import FoodSection from "../../components/FoodSection";
import PaxSection from "../../components/PaxSection";

const DailyOperations = () => {
  const [activeTab, setActiveTab] = useState("hotel");

  const tabs = [
    { key: "hotel", label: "Hotel Check-in/Check-out", icon: <Bed size={14} className="me-1" /> },
    { key: "ziyarat", label: "Ziyarat", icon: <MapPin size={14} className="me-1" /> },
    { key: "transport", label: "Transport", icon: <Truck size={14} className="me-1" /> },
    { key: "airport", label: "Airport", icon: <Plane size={14} className="me-1" /> },
    { key: "food", label: "Food", icon: <Coffee size={14} className="me-1" /> },
    { key: "pax", label: "Pax Details", icon: <UserIcon size={14} className="me-1" /> },
  ];

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <div className="bg-white rounded shadow-sm p-3">
                <h4 className="mb-4">Daily Operations</h4>
                
                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                  {tabs.map((t) => (
                    <Nav.Item key={t.key}>
                      <Nav.Link eventKey={t.key}>
                        {t.icon}
                        {t.label}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>

                {/* Render the appropriate section component based on active tab */}
                {activeTab === "hotel" && <HotelSection />}
                {activeTab === "ziyarat" && <ZiyaratSection />}
                {activeTab === "transport" && <TransportSection />}
                {activeTab === "airport" && <AirportSection />}
                {activeTab === "food" && <FoodSection />}
                {activeTab === "pax" && <PaxSection />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyOperations;
