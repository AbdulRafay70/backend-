import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Container } from "react-bootstrap";

import Profile from "./pages/agentside/Profile";
import Booking from "./pages/agentside/Booking";
import FlightBookingForm from "./pages/agentside/FlightBookingForm";
import BookingReview from "./pages/agentside/BookingReview";
import BookingPay from "./pages/agentside/BookingPay";
import AgentPayment from "./pages/agentside/AgentPayment";
import AgentAddDeposit from "./pages/agentside/AgentAddDeposit";
import AgentBankAccounts from "./pages/agentside/AgentBankAccounts";
import AgentHotels from "./pages/agentside/AgentHotels";
import AgentPackages from "./pages/agentside/AgentPackages";
import AgentPackagesDetail from "./pages/agentside/AgentPackagesDetail";
import AgentPackagesReview from "./pages/agentside/AgentPackagesReview";
import AgentPackagesPay from "./pages/agentside/AgentPackagesPay";
import AgentUmrahCalculator from "./pages/agentside/AgentUmrahCalculator";
import AgentCustomPackage from "./pages/agentside/AgentCustomPackage";
import AgentBookingForm from "./pages/agentside/AgentBookingForm";
import BookingSummary from "./pages/agentside/BookingSummary";
import CustomUmrahPackagesDetail from "./pages/agentside/CustomUmrahPackagesDetail";
import CustomUmrahPackagesReview from "./pages/agentside/CustomUmrahPackagesReview";
import CustomUmrahPackagesPay from "./pages/agentside/CustomUmrahPackagesPay";
import AgentBookingHistory from "./pages/agentside/AgentBookingHistory";
import AgentHotelVoucher from "./pages/agentside/AgentHotelVoucher";
import AgentBookingInvoice from "./pages/agentside/AgentBookingInvoice";
import AgentBookingGroupTicket from "./pages/agentside/AgentBookingGroupTicket";
import AgentGroupTicketInvoice from "./pages/agentside/AgentGroupTicketInvoice";
import PaxMovement from "./pages/agentside/PaxMovement";
import AgentPaxMovement from "./pages/agentside/AgentPaxMovement";
import AgentKuickpay from "./pages/agentside/AgentKuickpay";
import AgentLogin from "./pages/agentside/AgentLogin";
import AgentRegister from "./pages/agentside/AgentRegister";

import PrivateRoute from "./components/PrivateRoute";

import AgentProtectedRoute from "./components/AgentProtectedRoute";
function App() {
  return (
    <div className="d-flex">
      <Container fluid className="p-0">
        <Routes>
          {/* AgentSide */}
          <Route path="/login" element={<AgentLogin />} />
          <Route path="/register" element={<AgentRegister />} />

          <Route
            path="/"
            element={<Navigate to="/profile" replace />}
          />

          <Route
            path="/profile"
            element={
              <AgentProtectedRoute>
                <Profile />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <AgentProtectedRoute>
                <Booking />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking/detail"
            element={
              <AgentProtectedRoute>
                <FlightBookingForm />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking/review"
            element={
              <AgentProtectedRoute>
                <BookingReview />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking/pay"
            element={
              <AgentProtectedRoute>
                <BookingPay />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <AgentProtectedRoute>
                <AgentPayment />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/payment/add-deposit"
            element={
              <AgentProtectedRoute>
                <AgentAddDeposit />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/payment/bank-accounts"
            element={
              <AgentProtectedRoute>
                <AgentBankAccounts />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/kuickpay"
            element={
              <AgentProtectedRoute>
                <AgentKuickpay />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/hotels"
            element={
              <AgentProtectedRoute>
                <AgentHotels />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <AgentProtectedRoute>
                <AgentPackages />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/detail"
            element={
              <AgentProtectedRoute>
                <AgentPackagesDetail />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/booking"
            element={
              <AgentProtectedRoute>
                <AgentBookingForm />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/summary"
            element={
              <AgentProtectedRoute>
                <BookingSummary />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/review"
            element={
              <AgentProtectedRoute>
                <AgentPackagesReview />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/pay"
            element={
              <AgentProtectedRoute>
                <AgentPackagesPay />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/umrah-calculater"
            element={
              <AgentProtectedRoute>
                <AgentUmrahCalculator />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/custom-umrah"
            element={
              <AgentProtectedRoute>
                <AgentCustomPackage />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/custom-umrah/detail/:id"
            element={
              <AgentProtectedRoute>
                <CustomUmrahPackagesDetail />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/custom-umrah/review"
            element={
              <AgentProtectedRoute>
                <CustomUmrahPackagesReview />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/packages/custom-umrah/pay"
            element={
              <AgentProtectedRoute>
                <CustomUmrahPackagesPay />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking-history"
            element={
              <AgentProtectedRoute>
                <AgentBookingHistory />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking-history/hotel-voucher"
            element={
              <AgentProtectedRoute>
                <AgentHotelVoucher />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking-history/invoice"
            element={
              <AgentProtectedRoute>
                <AgentBookingInvoice />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking-history/group-tickets"
            element={
              <AgentProtectedRoute>
                <AgentBookingGroupTicket />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/booking-history/group-invoice"
            element={
              <AgentProtectedRoute>
                <AgentGroupTicketInvoice />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/pax-movement"
            element={
              <AgentProtectedRoute>
                <PaxMovement />
              </AgentProtectedRoute>
            }
          />
          <Route
            path="/agent-pax-movement"
            element={
              <AgentProtectedRoute>
                <AgentPaxMovement />
              </AgentProtectedRoute>
            }
          />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
