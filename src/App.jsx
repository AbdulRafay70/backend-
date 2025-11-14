import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Container } from "react-bootstrap";

import AdminLogin from "./pages/admin/login";
import Dashboard from "./pages/admin/dashboard";
import Logs from "./pages/admin/logs";
import Packages from "./pages/admin/Packages";
import HotelOutsourcing from "./pages/admin/HotelOutsourcing";
import AddPackages from "./pages/admin/AddPackages";
import VisaAndOther from "./pages/admin/VisaAndOther";
import Hotels from "./pages/admin/Hotels";
import AddHotel from "./pages/admin/AddHotel";
import HotelAvailabilityManager from "./pages/admin/HotelAvailabilityManager";
import IntimationTable from "./pages/admin/Intimation";
import Partners from "./pages/admin/Partners";
import Request from "./pages/admin/Request";
import Empolye from "./pages/admin/Empolye";
import PartnerPortal from "./pages/admin/PartnerPortal";
import TicketBooking from "./pages/admin/TicketBooking";
import TicketDetail from "./pages/admin/TicketDetail";
import AddTicket from "./pages/admin/AddTicket";
import Payment from "./pages/admin/Payment";
import AddPayment from "./pages/admin/AddPayment";
import BankAccounts from "./pages/admin/BankAccounts";
import PendingPayments from "./pages/admin/PendingPayments";
import BookingHistory from "./pages/admin/BookingHistory";
import OrderDeliverySystem from "./pages/admin/OrderDeliverySystem";
import TicketOrderList from "./pages/admin/TicketOrderList";
import OrderDeliveryDetailInvoice from "./pages/admin/OrderDeliveryDetailInvoice";
import UnPaidOrder from "./pages/admin/UnPaidOrder";
import RoleAndPermissions from "./pages/admin/RoleAndPermission";
import UpdateGroupPermissions from "./pages/admin/UpdatePermissions";
import Organization from "./pages/admin/Organization";
import Discounts from "./pages/admin/Discounts";
import DiscountsPermissions from "./pages/admin/DiscountsPermissions";
import Branches from "./pages/admin/Branches";
import Groups from "./pages/admin/Groups";
import PartnersMessage from "./pages/admin/AgenyMessage";
import ProfilePage from "./pages/admin/Profile";

import PrivateRoute from "./components/PrivateRoute";

import EditHotelDetail from "./pages/admin/EditHotelDetail";
import Agencies from "./pages/admin/Agencies";
import DailyOperations from "./pages/admin/DailyOperations";
import KuickpaySettings from "./pages/admin/KuickpaySettings";
import KuickpayTransactions from "./pages/admin/KuickpayTransactions";
import KuickpayWebhookLogs from "./pages/admin/KuickpayWebhookLogs";
import Kuickpay from "./pages/admin/Kuickpay";
import PaxMovementTracking from "./pages/admin/PaxMovementTracking";
import UniversalRegister from "./pages/admin/UniversalRegister";
import UniversalList from "./pages/admin/UniversalList";
import AgencyProfile from "./pages/admin/AgencyProfile";
import LeadManagement from "./pages/admin/LeadManagement";
import CommissionManagement from "./pages/admin/CommissionManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import RulesManagement from "./pages/admin/RulesManagement";
import FormList from "./pages/admin/FormList";
import FormBuilder from "./pages/admin/FormBuilder";
import BlogPageRouter from "./pages/BlogPageRouter";
import FormPage from "./pages/FormPage";

import AgentProtectedRoute from "./components/AgentProtectedRoute";
import BranchesDetails from "./pages/admin/BranchesDetails";
import PackageDetails from "./pages/admin/PackageDetails";

function App() {
  return (
    <div className="d-flex">
      <Container fluid className="p-0">
        <Routes>
          {/* Admin Side */}
          <Route path="/login" element={<AdminLogin />} />

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/logs"
            element={
              <PrivateRoute>
                <Logs />
              </PrivateRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <PrivateRoute>
                <Packages />
              </PrivateRoute>
            }
          />
          <Route
            path="/packages/add-packages"
            element={
              <PrivateRoute>
                <AddPackages />
              </PrivateRoute>
            }
          />
          <Route path="/packages/edit/:id" element={<PrivateRoute>
            <AddPackages mode="edit" />
          </PrivateRoute>} />

          <Route path="/packages/details/:id"
            element={
              <PrivateRoute>
                <PackageDetails />
              </PrivateRoute>}
          />

          <Route
            path="/packages/visa-and-other"
            element={
              <PrivateRoute>
                <VisaAndOther />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotels"
            element={
              <PrivateRoute>
                <Hotels />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotels/add"
            element={
              <PrivateRoute>
                <AddHotel />
              </PrivateRoute>
            }
          />
          {/* Backwards-compatible redirects for legacy links */}
          <Route path="/hotels/add-hotels" element={<Navigate to="/hotels/add" replace />} />
          <Route path="/hotel-availability-manager" element={<Navigate to="/hotel-availability" replace />} />
          <Route
            path="/hotels/edit/:id"
            element={
              <PrivateRoute>
                <AddHotel mode="edit" />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotel-availability"
            element={
              <PrivateRoute>
                <HotelAvailabilityManager />
              </PrivateRoute>
            }
          />
          <Route
            path="/universal-register"
            element={
              <PrivateRoute>
                <UniversalRegister />
              </PrivateRoute>
            }
          />
          <Route
            path="/universal-list"
            element={
              <PrivateRoute>
                <UniversalList />
              </PrivateRoute>
            }
          />
          <Route
            path="/lead-management"
            element={
              <PrivateRoute>
                <LeadManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/commission-management"
            element={
              <PrivateRoute>
                <CommissionManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/blog-management"
            element={
              <PrivateRoute>
                <BlogManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/daily-operations"
            element={
              <PrivateRoute>
                <DailyOperations />
              </PrivateRoute>
            }
          />
          <Route
            path="/rules"
            element={
              <PrivateRoute>
                <RulesManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/form-list"
            element={
              <PrivateRoute>
                <FormList />
              </PrivateRoute>
            }
          />
          <Route
            path="/form-builder"
            element={
              <PrivateRoute>
                <FormBuilder />
              </PrivateRoute>
            }
          />
          <Route
            path="/form-page/:id"
            element={
              <PrivateRoute>
                <FormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/intimation"
            element={
              <PrivateRoute>
                <IntimationTable />
              </PrivateRoute>
            }
          />
          <Route
            path="/pax-movement"
            element={
              <PrivateRoute>
                <PaxMovementTracking />
              </PrivateRoute>
            }
          />
          <Route
            path="/agency-profile"
            element={
              <PrivateRoute>
                <AgencyProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <Payment />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/add-payment"
            element={
              <PrivateRoute>
                <AddPayment />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/bank-accounts"
            element={
              <PrivateRoute>
                <BankAccounts />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/pending-payments"
            element={
              <PrivateRoute>
                <PendingPayments />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/booking-history"
            element={
              <PrivateRoute>
                <BookingHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/kuickpay"
            element={
              <PrivateRoute>
                <Kuickpay />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners"
            element={
              <PrivateRoute>
                <Partners />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/message/:id"
            element={
              <PrivateRoute>
                <PartnersMessage />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/organization"
            element={
              <PrivateRoute>
                <Organization />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/role-permissions"
            element={
              <PrivateRoute>
                <RoleAndPermissions />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/role-permissions/update-permissions"
            element={
              <PrivateRoute>
                <UpdateGroupPermissions />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/request"
            element={
              <PrivateRoute>
                <Request />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/discounts"
            element={
              <PrivateRoute>
                <Discounts />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/discounts/update-discountss"
            element={
              <PrivateRoute>
                <DiscountsPermissions />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/branche"
            element={
              <PrivateRoute>
                <Branches />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/branche/detail/:id"
            element={
              <PrivateRoute>
                <BranchesDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/agencies"
            element={
              <PrivateRoute>
                <Agencies />
              </PrivateRoute>
            }
          />
          {/* <Route
              path="/partners/group"
              element={
                <PrivateRoute>
                  <Groups />
                </PrivateRoute>
              }
            /> */}
          <Route
            path="/partners/empolye"
            element={
              <PrivateRoute>
                <Empolye />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/portal"
            element={
              <PrivateRoute>
                <PartnerPortal />
              </PrivateRoute>
            }
          />
          <Route
            path="/ticket-booking"
            element={
              <PrivateRoute>
                <TicketBooking />
              </PrivateRoute>
            }
          />
          <Route
            path="/ticket-booking/detail/:id"
            element={
              <PrivateRoute>
                <TicketDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/ticket-booking/add-ticket"
            element={
              <PrivateRoute>
                <AddTicket />
              </PrivateRoute>
            }
          />
          <Route
            path="/order-delivery"
            element={
              <PrivateRoute>
                <OrderDeliverySystem />
              </PrivateRoute>
            }
          />
          <Route
            path="/order-delivery/*"
            element={
              <PrivateRoute>
                <OrderDeliverySystem />
              </PrivateRoute>
            }
          />
          {/* <Route
            path="/order-delivery/ticketing"
            element={
              <PrivateRoute>
                <TicketOrderList />
              </PrivateRoute>
            }
          /> */}
          <Route
            path="/order-delivery/ticketing/*"
            element={
              <PrivateRoute>
                <TicketOrderList />
              </PrivateRoute>
            }
          />
          <Route
            path="/order-delivery/ticketing/invoice/:orderNo/"
            element={
              <PrivateRoute>
                <OrderDeliveryDetailInvoice />
              </PrivateRoute>
            }
          />
          {/* <Route
            path="/order-delivery/un-paid-orders"
            element={
              <PrivateRoute>
                <UnPaidOrder />
              </PrivateRoute>
            }
          /> */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          {/* Public Blog Pages Routes */}
          <Route path="/blogs/" element={<BlogPageRouter />} />
          <Route path="/blogs/:slug/" element={<BlogPageRouter />} />

          {/* Public Form Pages Routes */}
          <Route path="/forms/:formId" element={<FormPage />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
