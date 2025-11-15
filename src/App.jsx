import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Container } from "react-bootstrap";

import AdminLogin from "./pages/admin/Login";
import Dashboard from "./pages/admin/dashboard";
import Logs from "./pages/admin/logs";
import Packages from "./pages/admin/Packages";
import AddPackages from "./pages/admin/AddPackages";
import VisaAndOther from "./pages/admin/VisaAndOther";
import Hotels from "./pages/admin/Hotels";
import AddHotels from "./pages/admin/AddHotel";
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
import Finance from "./pages/admin/Finance";
import OrderDeliverySystem from "./pages/admin/OrderDeliverySystem";
import TicketOrderList from "./pages/admin/TicketOrderList";
import OrderDeliveryDetailInvoice from "./pages/admin/OrderDeliveryDetailInvoice";
import UnPaidOrder from "./pages/admin/UnPaidOrder";
import RoleAndPermissions from "./pages/admin/RoleAndPermission";
import UpdateGroupPermissions from "./pages/admin/UpdatePermissions";
import Organization from "./pages/admin/Organization";
import OrganizationLinks from "./pages/admin/OrganizationLinks";
import Discounts from "./pages/admin/Discounts";
import DiscountsPermissions from "./pages/admin/DiscountsPermissions";
import Branches from "./pages/admin/Branches";
import Groups from "./pages/admin/Groups";
import ProfilePage from "./pages/admin/Profile";
import CustomerManagement from "./pages/admin/CustomerManagement";

// New Advanced Admin Pages
import CommissionManagement from "./pages/admin/CommissionManagement";
import HotelOutsourcing from "./pages/admin/HotelOutsourcing";
import BlogManagement from "./pages/admin/BlogManagement";
import CustomerLead from "./pages/admin/CustomerLead";
import LeadManagement from "./pages/admin/LeadManagement";
import PassportLeads from "./pages/admin/PassportLeads";
import PaxMovementTracking from "./pages/admin/PaxMovementTracking";
import Kuickpay from "./pages/admin/Kuickpay";
import KuickpaySettings from "./pages/admin/KuickpaySettings";
import KuickpayTransactions from "./pages/admin/KuickpayTransactions";
import KuickpayWebhookLogs from "./pages/admin/KuickpayWebhookLogs";
import FormBuilder from "./pages/admin/FormBuilder";
import FormList from "./pages/admin/FormList";
import UniversalRegister from "./pages/admin/UniversalRegister";
import AgencyRelations from "./pages/admin/AgencyRelations";
import RulesManagement from "./pages/admin/RulesManagement";
import DailyOperations from "./pages/admin/DailyOperations";
import UnifiedFinancialHub from "./pages/admin/UnifiedFinancialHub";
import UnifiedHotelManagement from "./pages/admin/UnifiedHotelManagement";
import UnifiedLeadManagement from "./pages/admin/UnifiedLeadManagement";
import UnifiedOperationsHub from "./pages/admin/UnifiedOperationsHub";
import UnifiedSystemManagement from "./pages/admin/UnifiedSystemManagement";
import UnifiedUserManagement from "./pages/admin/UnifiedUserManagement";
import UniversalList from "./pages/admin/UniversalList";
import HotelAvailabilityManager from "./pages/admin/HotelAvailabilityManager";
import AgencyProfile from "./pages/admin/AgencyProfile";

import PrivateRoute from "./components/PrivateRoute";

import EditHotelDetail from "./pages/admin/EditHotelDetail";
import EditHotelPrice from "./pages/admin/EditHotelPrice";
import EditHotelAv from "./pages/admin/EditHotelAv";
// Agencies page removed from global partners tabs

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

          {/* Redirect legacy/top-level links to partners subpaths so
              both `/discounts` and `/admin/discounts` (when basename=/admin)
              resolve correctly. This avoids the "No routes matched" warning. */}
          <Route path="/discounts" element={<Navigate to="/partners/discounts" replace />} />
          <Route path="/portal" element={<Navigate to="/partners/portal" replace />} />
          <Route path="/branche" element={<Navigate to="/partners/branche" replace />} />

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
            path="/hotels/EditDetails/:id"
            element={
              <PrivateRoute>
                <EditHotelDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotels/EditPrices/:id"
            element={
              <PrivateRoute>
                <EditHotelPrice />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotels/editAv/:id"
            element={
              <PrivateRoute>
                <EditHotelAv />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotels/add-hotels"
            element={
              <PrivateRoute>
                <AddHotels />
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
            path="/partners"
            element={
              <PrivateRoute>
                <Partners />
              </PrivateRoute>
            }
          />
          {/* Duplicate partners routes with /admin prefix to support mounts under /admin */}
          <Route
            path="/admin/partners"
            element={
              <PrivateRoute>
                <Partners />
              </PrivateRoute>
            }
          />
          {/* Messages page removed */}
          <Route
            path="/partners/organization"
            element={
              <PrivateRoute>
                <Organization />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/partners/organization"
            element={
              <PrivateRoute>
                <Organization />
              </PrivateRoute>
            }
          />
          <Route
            path="/partners/organization-links"
            element={
              <PrivateRoute>
                <OrganizationLinks />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/partners/organization-links"
            element={
              <PrivateRoute>
                <OrganizationLinks />
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
            path="/admin/partners/role-permissions"
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
            path="/admin/partners/role-permissions/update-permissions"
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
            path="/admin/partners/request"
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
            path="/admin/partners/discounts"
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
            path="/admin/partners/discounts/update-discountss"
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
            path="/admin/partners/branche"
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
            path="/admin/partners/branche/detail/:id"
            element={
              <PrivateRoute>
                <BranchesDetails />
              </PrivateRoute>
            }
          />
          {/* Agencies removed from global partners navigation */}
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
            path="/admin/partners/empolye"
            element={
              <PrivateRoute>
                <Empolye />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer-management"
            element={
              <PrivateRoute>
                <CustomerManagement />
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
            path="/admin/partners/portal"
            element={
              <PrivateRoute>
                <PartnerPortal />
              </PrivateRoute>
            }
          />
          {/* top-level /portal route removed — portal is now accessed under /partners/portal */}
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
            path="/payment/kuickpay"
            element={
              <PrivateRoute>
                <Kuickpay />
              </PrivateRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <PrivateRoute>
                <Finance />
              </PrivateRoute>
            }
          />
          <Route
            path="/finance/*"
            element={
              <PrivateRoute>
                <Finance />
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

          {/* Commission Management Routes */}
          <Route
            path="/commission-management"
            element={
              <PrivateRoute>
                <CommissionManagement />
              </PrivateRoute>
            }
          />

          {/* Hotel Outsourcing Routes */}
          <Route
            path="/hotel-outsourcing"
            element={
              <PrivateRoute>
                <HotelOutsourcing />
              </PrivateRoute>
            }
          />

          {/* Blog Management Routes */}
          <Route
            path="/blog-management"
            element={
              <PrivateRoute>
                <BlogManagement />
              </PrivateRoute>
            }
          />

          {/* Lead Management Routes */}
          <Route
            path="/customer-leads"
            element={
              <PrivateRoute>
                <CustomerLead />
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
            path="/passport-leads"
            element={
              <PrivateRoute>
                <PassportLeads />
              </PrivateRoute>
            }
          />

          {/* Pax Movement Tracking Routes */}
          <Route
            path="/pax-movement"
            element={
              <PrivateRoute>
                <PaxMovementTracking />
              </PrivateRoute>
            }
          />

          {/* Kuickpay Integration Routes */}
          <Route
            path="/kuickpay"
            element={
              <PrivateRoute>
                <Kuickpay />
              </PrivateRoute>
            }
          />
          <Route
            path="/kuickpay/settings"
            element={
              <PrivateRoute>
                <KuickpaySettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/kuickpay/transactions"
            element={
              <PrivateRoute>
                <KuickpayTransactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/kuickpay/webhook-logs"
            element={
              <PrivateRoute>
                <KuickpayWebhookLogs />
              </PrivateRoute>
            }
          />

          {/* Form Builder System Routes */}
          <Route
            path="/form-builder"
            element={
              <PrivateRoute>
                <FormBuilder />
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
            path="/universal-register"
            element={
              <PrivateRoute>
                <UniversalRegister />
              </PrivateRoute>
            }
          />
          <Route
            path="/agency-relations"
            element={
              <PrivateRoute>
                <AgencyRelations />
              </PrivateRoute>
            }
          />

          {/* Rules Management Routes */}
          <Route
            path="/rules-management"
            element={
              <PrivateRoute>
                <RulesManagement />
              </PrivateRoute>
            }
          />

          {/* Daily Operations Routes */}
          <Route
            path="/daily-operations"
            element={
              <PrivateRoute>
                <DailyOperations />
              </PrivateRoute>
            }
          />

          {/* Unified Management Systems Routes */}
          <Route
            path="/unified-financial-hub"
            element={
              <PrivateRoute>
                <UnifiedFinancialHub />
              </PrivateRoute>
            }
          />
          <Route
            path="/unified-hotel-management"
            element={
              <PrivateRoute>
                <UnifiedHotelManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/unified-lead-management"
            element={
              <PrivateRoute>
                <UnifiedLeadManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/unified-operations-hub"
            element={
              <PrivateRoute>
                <UnifiedOperationsHub />
              </PrivateRoute>
            }
          />
          <Route
            path="/unified-system-management"
            element={
              <PrivateRoute>
                <UnifiedSystemManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/unified-user-management"
            element={
              <PrivateRoute>
                <UnifiedUserManagement />
              </PrivateRoute>
            }
          />

          {/* Universal System Routes */}
          <Route
            path="/universal-list"
            element={
              <PrivateRoute>
                <UniversalList />
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

          {/* Additional Hotel Management Routes */}
          <Route
            path="/hotel-availability-manager"
            element={
              <PrivateRoute>
                <HotelAvailabilityManager />
              </PrivateRoute>
            }
          />

          {/* Agency Profile Routes */}
          <Route
            path="/agency-profile/:id"
            element={
              <PrivateRoute>
                <AgencyProfile />
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
        </Routes>
      </Container>
    </div>
  );
}

export default App;
