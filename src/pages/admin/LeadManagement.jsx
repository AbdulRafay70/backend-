import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Spinner,
  Modal,
  Table,
  InputGroup,
  Pagination,
  Dropdown,
} from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import CRMTabs from "../../components/CRMTabs";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Phone,
  Mail,
  FileText,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  BarChart3,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import axios from "axios";
 
const LeadManagement = () => {

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddRemarksModal, setShowAddRemarksModal] = useState(false);
  const [showNextFollowupModal, setShowNextFollowupModal] = useState(false);

  // Add / Edit / View modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Validation errors for compact add form
  const [validationErrors, setValidationErrors] = useState({});

  // Create loan toggle when adding a lead
  const [createLoanWithLead, setCreateLoanWithLead] = useState(false);
  // Internal task toggle for Add Lead compact form
  const [isInternalTask, setIsInternalTask] = useState(false);
  // Close lead modal state
  const [showCloseLeadModal, setShowCloseLeadModal] = useState(false);
  const [closeLeadOption, setCloseLeadOption] = useState('lost');
  const [closeLeadRemarks, setCloseLeadRemarks] = useState('');

  // Selected item
  const [selectedLead, setSelectedLead] = useState(null);

  // Form state
  const [leadForm, setLeadForm] = useState({
    customer_full_name: "",
    passport_number: "",
    passport_expiry: "",
    contact_number: "",
    email: "",
    cnic_number: "",
    address: "",
    branch_id: "",
    lead_source: "walk-in",
    lead_status: "new",
    interested_in: "umrah",
    interested_travel_date: "",
    next_followup_date: "",
    next_followup_time: "",
    remarks: "",
    last_contacted_date: "",
    loan_promise_date: "",
    loan_amount: "",
    loan_status: "pending",
    recovered_amount: "",
    recovery_date: "",
    loan_remarks: "",
    conversion_status: "not_converted",
    whatsapp_number: "",

  });

  // Get organization and auth details
  const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
  const organizationId = orgData?.id || orgData?.organization || Number(localStorage.getItem('organizationId')) || Number(localStorage.getItem('organization')) || null;
  const token = localStorage.getItem("accessToken");

  // State management for leads and UI
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters for Leads tab
  const [filters, setFilters] = useState({
    search: "",
    lead_status: "",
    conversion_status: "",
    branch_id: "",
    interested_in: "",
    lead_source: "",
  });

  // normalize loan helper utilities
  const toNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // Normalize various date formats to YYYY-MM-DD for comparisons
  const normalizeDateYMD = (val) => {
    if (!val) return null;
    if (val instanceof Date) {
      const d = val;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const s = String(val);
    // If ISO format or already YYYY-MM-DD, take first 10 chars
    const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    // If contains T (with timezone), split
    if (s.includes('T')) return s.split('T')[0];
    // If contains space before time
    if (s.includes(' ')) return s.split(' ')[0];
    // Try common slash format dd/mm/yyyy or mm/dd/yyyy
    const slashMatch = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (slashMatch) {
      // assume dd/mm/yyyy -> convert to yyyy-mm-dd
      const [_, a, b, c] = slashMatch;
      return `${c}-${b}-${a}`;
    }
    // last resort: try Date parser
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return normalizeDateYMD(parsed);
    return null;
  };

  // Format ISO-ish datetime strings to a clean date + time (YYYY-MM-DD HH:MM)
  const formatDateTime = (val) => {
    if (!val) return '-';
    try {
      // Accept Date or string
      const d = (val instanceof Date) ? val : new Date(String(val));
      if (isNaN(d.getTime())) return String(val);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `${date} ${time}`;
    } catch (e) { return String(val); }
  };

  const getLoanAmount = (l) => toNumber(l.amount ?? l.loan_amount ?? l.loanAmount ?? l.loanAmountRaw ?? 0);
  const getRecoveredAmount = (l) => toNumber(l.recovered_amount ?? l.recoveredAmount ?? l.recovered_amount_raw ?? 0);
  const getLoanDueDate = (l) => normalizeDateYMD(l.due_date ?? l.loan_promise_date ?? l.loanPromiseDate ?? l.next_followup_date ?? null);
  const getRecoveryDate = (l) => normalizeDateYMD(
    l.recovery_date ?? l.recoveryDate ?? l.recovery_date_raw ?? l.raw?.recovery_date ?? l.raw?.recoveryDate ?? l.raw?.updated_at ?? l.raw?.updatedAt ?? null
  );

  // Current user and branch from user-details API
  const [currentUser, setCurrentUser] = useState(null);
  const [userBranchId, setUserBranchId] = useState(null);
  // Demo branches data
  const demoBranches = [
    { id: 1, name: "Lahore Main Branch" },
    { id: 2, name: "Karachi Branch" },
    { id: 3, name: "Islamabad Branch" },
    { id: 4, name: "Faisalabad Branch" },
    { id: 5, name: "Multan Branch" },
  ];

  // Demo leads data
  const demoLeads = [

  ];

  // Demo loans data
  const demoLoans = [

  ];

  // Loans state (populated from API)
  const [loans, setLoans] = useState([]);
  // Tasks state (populated from API)
  const [tasks, setTasks] = useState([]);
  // Filtered versions used for table rendering
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  // editing loan id when opening Add Loan modal in edit mode
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [selectedLoanForDelete, setSelectedLoanForDelete] = useState(null);
  // Active tab
  const [activeTab, setActiveTab] = useState("leads");

  // New loan form
  const [newLoanForm, setNewLoanForm] = useState({
    customer_full_name: "",
    contact_number: "",
    cnic_number: "",
    email: "",
    amount: "",
    reason: "",
    loan_promise_date: "",
    loan_status: "pending",
    recovered_amount: "",
    recovery_date: "",
    loan_remarks: "",
    last_contacted_date: "",
    whatsapp_number: "",
    assigned_to: "",
  });

  // Validation errors for Add Loan modal
  const [newLoanValidationErrors, setNewLoanValidationErrors] = useState({});

  // Add Loan modal
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  // Loan action modals (replace prompt flows)
  const [showClearLoanModal, setShowClearLoanModal] = useState(false);
  const [showRescheduleLoanModal, setShowRescheduleLoanModal] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [loanActionAmount, setLoanActionAmount] = useState("");
  const [loanActionDate, setLoanActionDate] = useState("");
  const [loanActionRemarks, setLoanActionRemarks] = useState("");
  const [selectedLoanForAction, setSelectedLoanForAction] = useState(null);

  // Add Task modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  // Loans filters state for Loans tab controls
  const [loanFilters, setLoanFilters] = useState({ search: "", status: "", branch_id: "", today_followups: false });
  // Tasks filters state for Tasks tab controls
  const [taskFilters, setTaskFilters] = useState({ search: "", status: "", branch_id: "", today_followups: false });
  const [taskForm, setTaskForm] = useState({
    mode: 'customer',
    customer_full_name: '',
    contact_number: '',
    whatsapp_number: '',
    address: '',
    next_followup_date: '',
    next_followup_time: '',
    task_description: '',
    task_type: 'call',
    assigned_to: '',
    status: 'pending',
    lead_status: 'new',
    loan_status: 'pending',
    due_date: '',
    time: '',
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

  // Remarks / followup modal state
  const [remarksInput, setRemarksInput] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("");
  const [followupRemarks, setFollowupRemarks] = useState("");

  const sendChatMessage = () => {
    const text = (chatInput || "").trim();
    if (!text) return;
    const msg = { id: Date.now(), author: "You", text, timestamp: new Date().toISOString() };
    setChatMessages((p) => [...p, msg]);
    setChatInput("");
  };

  useEffect(() => {
    try {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } catch (e) { }
  }, [chatMessages]);

  const handleAddLoan = async () => {
    const errors = {};
    if (!newLoanForm.customer_full_name) errors.customer_full_name = true;
    // Loan amount is required for creating a loan
    if (!newLoanForm.amount && newLoanForm.amount !== 0) errors.amount = true;
    // For simplified loan form, require name and either whatsapp/contact/email or amount/date
    if (!newLoanForm.whatsapp_number && !newLoanForm.contact_number && !newLoanForm.email && !newLoanForm.amount) errors.contact = true;
    if (!newLoanForm.loan_promise_date && !newLoanForm.due_date) errors.loan_promise_date = true;
    if (Object.keys(errors).length > 0) {
      setNewLoanValidationErrors(errors);
      showAlert("danger", "Please fill required loan fields");
      return;
    }
    setNewLoanValidationErrors({});

    if (!organizationId) {
      showAlert('danger', 'Organization is required. Please select an organization in the top-right (Organization selector).');
      return;
    }

    try {
      // Simplified loan payload: only keep Name, contact (whatsapp/email), address, amount and reason/date
      const payload = {
        customer_full_name: newLoanForm.customer_full_name || null,
        contact_number: newLoanForm.contact_number || null,
        whatsapp_number: newLoanForm.whatsapp_number || null,
        address: newLoanForm.address || null,
        email: newLoanForm.email || null,
        loan_amount: newLoanForm.amount ? Number(String(newLoanForm.amount).replace(/,/g, '')) : 0,
        loan_promise_date: newLoanForm.loan_promise_date || newLoanForm.due_date || null,
        remarks: newLoanForm.reason || null,
        organization: organizationId,
        branch: newLoanForm.branch_id ? Number(newLoanForm.branch_id) : (userBranchId || getUserBranchId()),
        created_by_user: null,
      };

      if (editingLoanId) {
        // Update existing loan (use PATCH to update only provided fields)
        await axios.patch(`http://127.0.0.1:8000/api/leads/update/${editingLoanId}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showAlert("success", "Loan updated successfully");
      } else {
        // Create new loan
        await axios.post(`http://127.0.0.1:8000/api/leads/create/`, { ...payload, created_by_user: getCurrentUserId() }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showAlert("success", "Loan created successfully");
      }

      setShowAddLoanModal(false);
      setNewLoanForm({ customer_full_name: "", contact_number: "", cnic_number: "", email: "", amount: "", reason: "", loan_promise_date: "", loan_status: "pending", recovered_amount: "", recovery_date: "", loan_remarks: "", last_contacted_date: "", whatsapp_number: "", assigned_to: "", address: "" });
      setChatMessages([]);
      setChatInput("");
      setEditingLoanId(null);
      setActiveTab("loans");

      // Refresh server data
      fetchLeads();
      fetchLoans();
      fetchTasks();
    } catch (error) {
      console.error('Failed to create loan:', error);
      showAlert('danger', 'Failed to create loan');
    }
  };

  const openEditLoanModal = (loan) => {
    // Prefill only the simplified fields
    setNewLoanForm({
      customer_full_name: loan.customer_full_name || "",
      whatsapp_number: loan.whatsapp_number || loan.whatsapp || "",
      address: loan.address || loan.raw?.address || "",
      email: loan.email || "",
      amount: loan.amount || loan.loan_amount || "",
      reason: loan.reason || loan.remarks || "",
      loan_promise_date: loan.due_date || loan.loan_promise_date || "",
    });
    setEditingLoanId(loan.id);
    setShowAddLoanModal(true);
  };

  // Loan action handlers: Clear, Reschedule, Add Balance, Add Remarks
  const handleLoanAddRemarks = (loan) => {
    // Reuse Add Remarks modal which fetches lead detail
    openAddRemarksModal(loan);
  };

  // Open modals for loan actions
  const openClearLoanModal = (loan) => {
    setSelectedLoanForAction(loan);
    // Prefill with remaining amount (full loan - recovered) as confirmation to clear full loan
    const total = getLoanAmount(loan) || 0;
    const recovered = getRecoveredAmount(loan) || 0;
    const remaining = Math.max(total - recovered, 0);
    setLoanActionAmount(String(remaining || total));
    setLoanActionRemarks('');
    setShowClearLoanModal(true);
  };

  const openRescheduleLoanModal = (loan) => {
    setSelectedLoanForAction(loan);
    setLoanActionDate(getLoanDueDate(loan) || '');
    setLoanActionRemarks('');
    setShowRescheduleLoanModal(true);
  };

  const openAddBalanceModal = (loan) => {
    setSelectedLoanForAction(loan);
    setLoanActionAmount('0');
    setLoanActionRemarks('');
    setShowAddBalanceModal(true);
  };

  // Submit handlers for modals (reuse previous network logic)
  const submitClearLoan = async () => {
    const loan = selectedLoanForAction;
    if (!loan) return;
    try {
      // For Clear Loan confirm full clearance: set recovered_amount to full loan amount
      const total = getLoanAmount(loan) || 0;
      const payload = {
        organization: organizationId,
        branch: loan.branch_id || loan.branch || (userBranchId || getUserBranchId()),
        recovered_amount: total,
        loan_status: 'cleared',
      };
      await axios.patch(`http://127.0.0.1:8000/api/leads/update/${loan.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } });

      const followupPayload = {
        lead: loan.id,
        followup_date: (new Date()).toISOString().split('T')[0],
        contacted_via: 'cash',
        remarks: loanActionRemarks || `Loan cleared in full. Collected: Rs. ${total}`,
        organization: organizationId,
        branch: loan.branch_id || loan.branch || (userBranchId || getUserBranchId()),
        followup_result: 'loan_cleared',
      };
      await axios.post(`http://127.0.0.1:8000/api/leads/followup/`, followupPayload, { headers: { Authorization: `Bearer ${token}` } });

      showAlert('success', 'Loan cleared in full');
      setShowClearLoanModal(false);
      fetchLeads();
      fetchLoans();
    } catch (err) {
      console.error('Failed to clear loan', err);
      showAlert('danger', 'Failed to clear loan');
    }
  };

  const submitRescheduleLoan = async () => {
    const loan = selectedLoanForAction;
    if (!loan) return;
    try {
      const newDate = loanActionDate;
      if (!newDate) { showAlert('danger', 'Please provide a date'); return; }
      const payload = {
        organization: organizationId,
        branch: loan.branch_id || loan.branch || (userBranchId || getUserBranchId()),
        loan_promise_date: newDate,
      };
      await axios.patch(`http://127.0.0.1:8000/api/leads/update/${loan.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } });

      const followupPayload = {
        lead: loan.id,
        followup_date: (new Date()).toISOString().split('T')[0],
        contacted_via: 'call',
        remarks: loanActionRemarks || `Loan rescheduled to ${newDate}`,
        organization: organizationId,
        branch: loan.branch_id || loan.branch || (userBranchId || getUserBranchId()),
        followup_result: 'loan_rescheduled',
      };
      await axios.post(`http://127.0.0.1:8000/api/leads/followup/`, followupPayload, { headers: { Authorization: `Bearer ${token}` } });

      showAlert('success', 'Loan rescheduled');
      setShowRescheduleLoanModal(false);
      fetchLeads();
      fetchLoans();
    } catch (err) {
      console.error('Failed to reschedule loan', err);
      showAlert('danger', 'Failed to reschedule loan');
    }
  };

  const submitAddBalance = async () => {
    const loan = selectedLoanForAction;
    if (!loan) return;
    try {
      const addAmt = Number(String(loanActionAmount).replace(/,/g, '')) || 0;
      const currentRecovered = getRecoveredAmount(loan) || 0;
      const newRecovered = currentRecovered + addAmt;
      const loanAmount = getLoanAmount(loan) || 0;
      const payload = {
        organization: organizationId,
        branch: loan.branch_id || loan.branch || (userBranchId || getUserBranchId()),
        recovered_amount: newRecovered,
        loan_status: newRecovered >= loanAmount ? 'cleared' : (loan.loan_status || loan.status || 'pending'),
      };
      await axios.patch(`http://127.0.0.1:8000/api/leads/update/${loan.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } });

      const followupPayload = {
        lead: loan.id,
        followup_date: (new Date()).toISOString().split('T')[0],
        contacted_via: 'cash',
        remarks: loanActionRemarks || `Collected Rs. ${addAmt}. Total recovered: Rs. ${newRecovered}`,
        organization: organizationId,
        branch: loan.branch_id || loan.branch || (userBranchId || getUserBranchId()),
        followup_result: 'loan_collection',
      };
      await axios.post(`http://127.0.0.1:8000/api/leads/followup/`, followupPayload, { headers: { Authorization: `Bearer ${token}` } });

      showAlert('success', 'Recovered amount recorded');
      setShowAddBalanceModal(false);
      fetchLeads();
      fetchLoans();
    } catch (err) {
      console.error('Failed to add balance', err);
      showAlert('danger', 'Failed to add balance');
    }
  };

  const openDeleteLoanModal = (loan) => {
    // set the selected lead (loan entries are lead records with loan info)
    setSelectedLoanForDelete(loan);
    setSelectedLead(loan);
    setShowDeleteModal(true);
  };

  const handleDeleteLoan = () => {
    if (!selectedLoanForDelete) return;
    setLoans((prev) => prev.filter((l) => l.id !== selectedLoanForDelete.id));
    setSelectedLoanForDelete(null);
    setShowDeleteModal(false);
    showAlert('success', 'Loan deleted');
  };

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/leads/list/`, {
        params: { organization: organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = Array.isArray(response.data) ? response.data : [];

      // detection helpers
      const asNumber = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      // A record is considered a "loan" if it has a positive loan_amount OR a positive recovered_amount.
      // This follows the rule: if both loan_amount and recovered_amount are 0, don't show it in Loans.
      const hasLoan = (item) => {
        if (!item) return false;
        const loanAmt = asNumber(item.loan_amount || item.amount || 0);
        const recAmt = asNumber(item.recovered_amount || item.recovered || 0);
        return loanAmt > 0 || recAmt > 0;
      };

      const hasTask = (item) => !!(
        item && (
          (Array.isArray(item.tasks) && item.tasks.length > 0) ||
          item.is_internal_task ||
          item.task_type ||
          item.assigned_to ||
          item.task_description
        )
      );

      // Classify records: loans first, then tasks (exclusive), else leads
      const rawLoans = all.filter(hasLoan);
      const tasksArr = all.filter((it) => !hasLoan(it) && hasTask(it));
      const leadsArr = all.filter((it) => !hasLoan(it) && !hasTask(it));

      // Normalize loan objects so the Loans table can read consistent fields
      const loansArr = rawLoans.map((item) => {
        const amount = Number(item.loan_amount ?? item.amount ?? 0);
        const recovered = Number(item.recovered_amount ?? item.recovered ?? 0);
        // prefer next_followup_date/time when present as the due date/time
        const dueDateRaw = item.next_followup_date || item.loan_promise_date || item.due_date || null;
        const dueDate = normalizeDateYMD(dueDateRaw) || null;
        const dueTime = item.next_followup_time || item.time || null;

        // compute derived loan status: cleared if recovered >= amount, overdue if due date passed and recovered < amount
        let computedStatus = (item.loan_status || item.status || 'pending');
        try {
          const a = Number.isFinite(amount) ? amount : (isNaN(Number(amount)) ? 0 : Number(amount));
          const r = Number.isFinite(recovered) ? recovered : (isNaN(Number(recovered)) ? 0 : Number(recovered));
          if (a > 0 && r >= a) {
            computedStatus = 'cleared';
          } else if (a > 0 && dueDate) {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
            if (dueDate < todayStr) {
              // if due date has passed and not fully recovered
              if (r < a) computedStatus = 'overdue';
            }
          }
        } catch (e) { /* ignore and keep original status */ }

        return {
          id: item.id,
          customer_full_name: item.customer_full_name,
          contact_number: item.contact_number,
          email: item.email,
          amount: Number.isFinite(amount) ? amount : 0,
          due_date: dueDateRaw,
          time: dueTime,
          reason: item.remarks || item.reason || item.notes || null,
          // expose both fields so callers that read either work consistently
          loan_status: computedStatus,
          status: computedStatus,
          recovered_amount: Number.isFinite(recovered) ? recovered : 0,
          recovery_date: item.recovery_date || null,
          branch_id: item.branch || item.branch_id || item.branch_id || null,
          branch_name: item.branch_name || (branches.find(b => b.id === (item.branch || item.branch_id)) || {}).name || '',
          // keep raw payload for other uses
          raw: item,
        };
      });

      setLeads(leadsArr.length > 0 ? leadsArr : leadsArr.length === 0 ? (leadsArr.length === 0 && leadsArr.length === 0 ? demoLeads : leadsArr) : leadsArr);
      setLoans(loansArr);
      // Normalize tasks: ensure due_date/time reflect next follow-up when available
      const normalizedTasks = tasksArr.map((item) => {
        return {
          id: item.id,
          customer_full_name: item.customer_full_name || item.customer_name || null,
          contact_number: item.contact_number || null,
          email: item.email || null,
          assigned_to: item.assigned_to || item.assigned_to_id || null,
          assigned_to_name: item.assigned_to_name || item.assigned_to_name || null,
          task_type: item.task_type || item.type || null,
          remarks: item.remarks || item.task_description || item.notes || null,
          status: item.status || 'pending',
          // preserve loan_status if present on the record
          loan_status: item.loan_status || 'pending',
          // include lead_status from the record (defaults to 'new')
          lead_status: item.lead_status || 'new',
          // prefer next_followup_date/time for due date/time display
          due_date: item.next_followup_date || item.due_date || null,
          time: item.next_followup_time || item.time || null,
          branch_id: item.branch || item.branch_id || null,
          is_internal: !!(item.is_internal_task || item.is_internal),
          branch_name: item.branch_name || (branches.find(b => b.id === (item.branch || item.branch_id)) || {}).name || '',
          raw: item,
        };
      });
      setTasks(normalizedTasks);
    } catch (error) {
      console.error("Error fetching leads:", error);
      // fallback to demo data for leads and loans
      setLeads(demoLeads);
      setLoans(demoLoans);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch loans (using leads list API per request)
  const fetchLoans = async () => {
    // delegate to fetchLeads which classifies results into loans/tasks/leads
    await fetchLeads();
  };

  // Fetch tasks (using leads list API per request)
  const fetchTasks = async () => {
    // delegate to fetchLeads which classifies results into loans/tasks/leads
    await fetchLeads();
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/branches/`, {
        params: { organization: organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(response.data && response.data.length > 0 ? response.data : demoBranches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches(demoBranches);
    }
  };

  useEffect(() => {
    // fetch user details to get branch info, then load lists
    const fetchCurrentUser = async () => {
      try {
        if (!token) return;
        const decoded = decodeJwt(token);
        const userId = decoded.user_id || decoded.id;
        if (!userId) return;
        const resp = await axios.get(`http://127.0.0.1:8000/api/users/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(resp.data);
        // extract branch id from several possible shapes returned by user-details API
        let b = null;
        if (resp.data) {
          if (resp.data.branch) b = resp.data.branch;
          else if (resp.data.branch_id) b = resp.data.branch_id;
          else if (resp.data.profile && resp.data.profile.branch_id) b = resp.data.profile.branch_id;
          // new: some APIs return an array `branch_details`: [{id: 42, name: 'x'}, ...]
          else if (Array.isArray(resp.data.branch_details) && resp.data.branch_details.length > 0) {
            const first = resp.data.branch_details[0];
            if (first && (first.id || first.id === 0)) b = first.id;
            else b = first; // fallback if it's a raw number
          }
        }

        if (b !== null && b !== undefined) setUserBranchId(Number(b));
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };

    fetchCurrentUser().finally(() => {
      fetchBranches();
      fetchLeads();
      fetchLoans();
      fetchTasks();
    });
  }, []);

  // Apply loan filters locally
  useEffect(() => {
    let filtered = loans || [];
    if (loanFilters?.search) {
      const s = loanFilters.search.toLowerCase();
      filtered = filtered.filter(l => (l.customer_full_name || '').toLowerCase().includes(s) || (l.contact_number || '').includes(loanFilters.search) || (l.email || '').toLowerCase().includes(s));
    }
    if (loanFilters?.status) filtered = filtered.filter(l => ((l.status || l.loan_status || '')).toString() === loanFilters.status.toString());
    if (loanFilters?.branch_id) filtered = filtered.filter(l => String(l.branch_id || l.branch_name || '') === String(loanFilters.branch_id));
    if (loanFilters?.today_followups) {
      const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(l => (getLoanDueDate(l) === today) || ((l.recovery_date || l.recoveryDate) === today) || (l.next_followup_date === today));
    }
    setFilteredLoans(filtered);
  }, [loanFilters, loans]);

  // Apply task filters locally
  useEffect(() => {
    let filtered = tasks || [];
    if (taskFilters?.search) {
      const s = taskFilters.search.toLowerCase();
      filtered = filtered.filter(t => (t.customer_full_name || '').toLowerCase().includes(s) || (t.contact_number || '').includes(taskFilters.search) || (t.remarks || '').toLowerCase().includes(s));
    }
    if (taskFilters?.status) filtered = filtered.filter(t => (getTaskDisplayStatus(t) || '').toString() === taskFilters.status.toString());
    if (taskFilters?.branch_id) filtered = filtered.filter(t => String(t.branch_id || t.branch_name || '') === String(taskFilters.branch_id));
    if (taskFilters?.today_followups) {
      const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(t => (t.due_date === today) || (t.next_followup_date === today));
    }
    setFilteredTasks(filtered);
  }, [taskFilters, tasks]);

  // Filter leads based on search and filters
  useEffect(() => {
    let filtered = leads;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.customer_full_name?.toLowerCase().includes(searchLower) ||
          lead.contact_number?.includes(filters.search) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.passport_number?.includes(filters.search)
      );
    }

    if (filters.lead_status)
      filtered = filtered.filter((lead) => lead.lead_status === filters.lead_status);
    if (filters.conversion_status)
      filtered = filtered.filter((lead) => lead.conversion_status === filters.conversion_status);
    if (filters.branch_id)
      filtered = filtered.filter((lead) => lead.branch_id === parseInt(filters.branch_id));
    if (filters.interested_in)
      filtered = filtered.filter((lead) => lead.interested_in === filters.interested_in);
    if (filters.lead_source)
      filtered = filtered.filter((lead) => lead.lead_source === filters.lead_source);

    if (filters.today_followups) {
      const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter((lead) => normalizeDateYMD(lead.next_followup_date) === today);
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [filters, leads]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Show alert helper
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  // Map task status to loan_status
  const mapTaskStatusToLoanStatus = (status) => {
    if (!status) return 'pending';
    if (status === 'completed') return 'cleared';
    if (status === 'overdue') return 'overdue';
    return 'pending';
  };

  // Helper to derive a fallback branch id from available user info
  const getUserBranchId = () => {
    try {
      if (userBranchId) return userBranchId;
      if (!currentUser) return null;
      const u = currentUser;
      if (u.branch) return Number(u.branch);
      if (u.branch_id) return Number(u.branch_id);
      if (u.profile && u.profile.branch_id) return Number(u.profile.branch_id);
      if (Array.isArray(u.branch_details) && u.branch_details.length > 0) {
        const first = u.branch_details[0];
        if (first && (first.id || first.id === 0)) return Number(first.id);
        return Number(first);
      }
    } catch (e) {
      // ignore and fallback to null
    }
    return null;
  };

  // Small JWT decode helper (no dependency) — returns decoded payload or {} on error
  const decodeJwt = (token) => {
    try {
      if (!token) return {};
      const parts = token.split('.');
      if (parts.length < 2) return {};
      const payload = parts[1];
      // Replace URL-safe chars and pad
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const json = atob(padded);
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch (e) {
      try {
        // fallback: try basic atob -> JSON.parse
        const parts = token.split('.');
        const json = atob(parts[1] || '');
        return JSON.parse(json || '{}');
      } catch (e2) {
        return {};
      }
    }
  };

  // Get current user id: prefer `currentUser.id`, fallback to decoding token
  const getCurrentUserId = () => {
    try {
      if (currentUser && (currentUser.id || currentUser.pk)) return Number(currentUser.id || currentUser.pk);
      const decoded = decodeJwt(token);
      return Number(decoded.user_id || decoded.id || decoded.sub || decoded.user || null) || null;
    } catch (e) { return null; }
  };

  // Handle add lead
  const handleAddLead = async () => {
    const errors = {};
    if (!isInternalTask) {
      if (!leadForm.customer_full_name) errors.customer_full_name = true;
      if (!leadForm.contact_number) errors.contact_number = true;
    }
    if (!leadForm.next_followup_date) errors.next_followup_date = true;
    if (!leadForm.next_followup_time) errors.next_followup_time = true;
    if (!leadForm.remarks || !leadForm.remarks.trim()) errors.remarks = true;
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      showAlert('danger', 'Please fill required fields');
      return;
    }

    try {
      // Normalize payload to API field names
      const payload = {
        customer_full_name: leadForm.customer_full_name,
        passport_number: leadForm.passport_number || null,
        passport_expiry: leadForm.passport_expiry || null,
        contact_number: leadForm.contact_number,
        whatsapp_number: leadForm.whatsapp_number || null,
        email: leadForm.email || null,
        cnic_number: leadForm.cnic_number || null,
        address: leadForm.address || null,
        branch: leadForm.branch_id ? Number(leadForm.branch_id) : (userBranchId || getUserBranchId()),
        organization: organizationId,
        lead_source: leadForm.lead_source,
        lead_status: leadForm.lead_status,
        interested_in: leadForm.interested_in === 'umrah_package' ? 'umrah' : leadForm.interested_in,
        interested_travel_date: leadForm.interested_travel_date || null,
        // next_followup_date/time will be posted separately to the followup API if present
        remarks: leadForm.remarks || null,
        conversion_status: leadForm.conversion_status || null,
        created_by_user: null,
      };

      // Attach loan fields if requested
      if (createLoanWithLead) {
        if (leadForm.loan_amount) payload.loan_amount = Number(leadForm.loan_amount);
        if (leadForm.loan_promise_date) payload.loan_promise_date = leadForm.loan_promise_date;
        if (leadForm.loan_status) payload.loan_status = leadForm.loan_status;
        if (leadForm.recovered_amount) payload.recovered_amount = Number(leadForm.recovered_amount);
        if (leadForm.recovery_date) payload.recovery_date = leadForm.recovery_date;
        if (leadForm.loan_remarks) payload.loan_remarks = leadForm.loan_remarks;
      }

        const createResp = await axios.post(`http://127.0.0.1:8000/api/leads/create/`, { ...payload, created_by_user: getCurrentUserId() }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If follow-up date/time were provided, post them to the followup endpoint
      try {
        const leadId = createResp?.data?.id || createResp?.data?.pk || null;
        if ((leadForm.next_followup_date || leadForm.next_followup_time) && leadId) {
          const followupPayload = {
            lead: leadId,
            // required by API: the date this followup record is created
            followup_date: (new Date()).toISOString().split('T')[0],
            // one of the allowed contacted_via choices: 'call'|'whatsapp'|'in-person'
            contacted_via: 'call',
            next_followup_date: leadForm.next_followup_date || null,
            next_followup_time: leadForm.next_followup_time || null,
            remarks: leadForm.remarks || null,
            organization: organizationId,
            branch: leadForm.branch_id ? Number(leadForm.branch_id) : (userBranchId || getUserBranchId()),
          };

          await axios.post(`http://127.0.0.1:8000/api/leads/followup/`, followupPayload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (fupErr) {
        console.error('Failed to post followup after lead create:', fupErr);
      }

      showAlert("success", "Lead added successfully!");
      setShowAddModal(false);
      // refresh lists from server
      fetchLeads();
      fetchLoans();
      fetchTasks();

      resetForm();
    } catch (error) {
      console.error('Failed to add lead:', error);
      showAlert("danger", "Failed to add lead");
    }
  };

  // Handle edit lead
  const handleEditLead = async () => {
    if (!leadForm.next_followup_date || !leadForm.next_followup_time || !leadForm.remarks) {
      setValidationErrors({ next_followup_date: !leadForm.next_followup_date, next_followup_time: !leadForm.next_followup_time, remarks: !leadForm.remarks });
      showAlert('danger', 'Follow-up date, time and remarks are required');
      return;
    }

    try {
      const payload = {
        ...leadForm,
        organization: organizationId,
        branch: leadForm.branch_id ? Number(leadForm.branch_id) : (userBranchId || getUserBranchId()),
      };

      await axios.put(
        `http://127.0.0.1:8000/api/leads/update/${selectedLead.id}/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showAlert("success", "Lead updated successfully!");
      setShowEditModal(false);
      fetchLeads();
      resetForm();
    } catch (error) {
      showAlert("error", "Failed to update lead");
    }
  };

  // Close lead (set lead_status to 'closed')
  const handleCloseLead = async (lead) => {
    // legacy immediate close (kept for compatibility) - opens modal instead
    openCloseLeadModal(lead);
  };

  // Helper: detect if a record is a Task (has task-specific fields)
  const isTaskRecord = (rec) => {
    if (!rec) return false;
    return Boolean(rec.task_description || rec.task_type || rec.assigned_to || rec.status || rec.due_date || rec.time);
  };

  const openCloseLeadModal = (lead) => {
    setSelectedLead(lead);
    setCloseLeadOption('lost');
    setCloseLeadRemarks('');
    setShowCloseLeadModal(true);
  };

  const submitCloseLead = async () => {
    if (!selectedLead) return;
    if (!closeLeadRemarks || !closeLeadRemarks.trim()) {
      showAlert('danger', 'Remarks are required to close the lead');
      return;
    }

    try {
      const basePayload = { organization: organizationId, branch: selectedLead.branch || selectedLead.branch_id || (userBranchId || getUserBranchId()) };

      if (isTaskRecord(selectedLead)) {
        // For tasks, mark the task status as completed (use PATCH to avoid overwriting other fields)
        const taskPayload = { ...basePayload, status: 'completed' };
        await axios.patch(`http://127.0.0.1:8000/api/leads/update/${selectedLead.id}/`, taskPayload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        // For leads, preserve existing close options
        const updatePayload = { ...basePayload };
        if (closeLeadOption === 'lost') {
          updatePayload.lead_status = 'lost';
        } else if (closeLeadOption === 'converted') {
          updatePayload.conversion_status = 'converted_to_booking';
          updatePayload.lead_status = 'confirmed';
        }

        await axios.patch(`http://127.0.0.1:8000/api/leads/update/${selectedLead.id}/`, updatePayload, { headers: { Authorization: `Bearer ${token}` } });
      }

      // Save a followup/remark documenting the close action
      const followupPayload = {
        lead: selectedLead.id,
        followup_date: (new Date()).toISOString().split('T')[0],
        contacted_via: 'call',
        remarks: closeLeadRemarks || null,
        organization: organizationId,
        branch: selectedLead.branch || selectedLead.branch_id || (userBranchId || getUserBranchId()),
        followup_result: closeLeadOption,
      };

      await axios.post(`http://127.0.0.1:8000/api/leads/followup/`, followupPayload, { headers: { Authorization: `Bearer ${token}` } });

      showAlert('success', isTaskRecord(selectedLead) ? 'Task closed' : 'Lead closed');
      setShowCloseLeadModal(false);
      setCloseLeadRemarks('');
      fetchLeads();
      fetchLoans();
      fetchTasks();
      try {
        const resp = await axios.get(`http://127.0.0.1:8000/api/leads/${selectedLead.id}/`, { headers: { Authorization: `Bearer ${token}` }, params: { organization: organizationId } });
        setSelectedLead(resp.data || selectedLead);
      } catch (e) { }
    } catch (err) {
      console.error('Failed to close lead', err);
      showAlert('danger', isTaskRecord(selectedLead) ? 'Failed to close task' : 'Failed to close lead');
    }
  };

  // Open Add Remarks modal
  const openAddRemarksModal = (lead) => {
    // Fetch latest lead details (including followups) so user sees history while adding a remark
    (async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`http://127.0.0.1:8000/api/leads/${lead.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { organization: organizationId },
        });
        setSelectedLead(resp.data || lead);
        setRemarksInput(resp.data?.remarks || lead?.remarks || '');
      } catch (err) {
        console.error('Failed to fetch lead details for remarks modal:', err);
        setSelectedLead(lead);
        setRemarksInput(lead?.remarks || '');
      } finally {
        setLoading(false);
        setShowAddRemarksModal(true);
      }
    })();
  };

  const handleAddRemarks = async () => {
    if (!selectedLead) return;
    try {
      const payload = {
        lead: selectedLead.id,
        // API expects YYYY-MM-DD for followup_date
        followup_date: (new Date()).toISOString().split('T')[0],
        contacted_via: 'call',
        remarks: remarksInput || null,
        organization: organizationId,
        branch: selectedLead.branch || selectedLead.branch_id || (userBranchId || getUserBranchId()),
      };

      await axios.post(`http://127.0.0.1:8000/api/leads/followup/`, payload, { headers: { Authorization: `Bearer ${token}` } });

      showAlert('success', 'Remark saved');
      setShowAddRemarksModal(false);
      setRemarksInput('');

      // Refresh lists and refetch selected lead so history updates immediately
      fetchLeads();
      try {
        const resp = await axios.get(`http://127.0.0.1:8000/api/leads/${selectedLead.id}/`, { headers: { Authorization: `Bearer ${token}` }, params: { organization: organizationId } });
        setSelectedLead(resp.data || selectedLead);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Failed to add remarks', err);
      showAlert('danger', 'Failed to add remarks');
    }
  };

  // Open Next Follow-up modal
  const openNextFollowupModal = (lead) => {
    setSelectedLead(lead);
    setFollowupDate('');
    setFollowupTime('');
    setFollowupRemarks('');
    setShowNextFollowupModal(true);
  };

  const handleSetNextFollowup = async () => {
    if (!selectedLead) return;
    if (!followupRemarks || !followupRemarks.trim()) {
      showAlert('danger', 'Remarks are required for next follow-up');
      return;
    }
    try {
      const payload = {
        lead: selectedLead.id,
        followup_date: (new Date()).toISOString().split('T')[0],
        contacted_via: 'call',
        next_followup_date: followupDate || null,
        next_followup_time: followupTime || null,
        remarks: followupRemarks || null,
        organization: organizationId,
        branch: selectedLead.branch || selectedLead.branch_id || (userBranchId || getUserBranchId()),
      };
      await axios.post(`http://127.0.0.1:8000/api/leads/followup/`, payload, { headers: { Authorization: `Bearer ${token}` } });
      showAlert('success', 'Next follow-up scheduled');
      setShowNextFollowupModal(false);
      setFollowupDate('');
      setFollowupTime('');
      setFollowupRemarks('');
      fetchLeads();
    } catch (err) {
      console.error('Failed to set next followup', err);
      showAlert('danger', 'Failed to set follow-up');
    }
  };

  // Handle delete lead
  const handleDeleteLead = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/leads/${selectedLead.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Lead deleted successfully!");
      setShowDeleteModal(false);
      fetchLeads();
    } catch (error) {
      showAlert("error", "Failed to delete lead");
    }
  };

  // Create task via leads API (tasks use leads API per requirement)
  const handleCreateTask = async () => {
    // validate
    const errors = [];
    if (taskForm.mode === 'customer') {
      if (!taskForm.customer_full_name.trim()) errors.push('customer_full_name');
      if (!taskForm.contact_number.trim()) errors.push('contact_number');
    }
    if (!taskForm.task_description.trim()) errors.push('task_description');
    if (errors.length) { showAlert('danger', 'Please fill required fields for the task'); return; }

    try {
      const payload = {
        // Simplified task payload: customer identity, contact, description and internal flag
        customer_full_name: taskForm.customer_full_name && taskForm.customer_full_name.trim() ? taskForm.customer_full_name.trim() : null,
        contact_number: taskForm.contact_number && taskForm.contact_number.trim() ? taskForm.contact_number.trim() : null,
        whatsapp_number: taskForm.whatsapp_number && taskForm.whatsapp_number.trim() ? taskForm.whatsapp_number.trim() : null,
        organization: organizationId,
        branch: taskForm.branch_id ? Number(taskForm.branch_id) : (userBranchId || getUserBranchId()),
        is_internal_task: taskForm.mode === 'internal',
        // include both `remarks` and `task_description` so backend and frontend classifiers work
        remarks: taskForm.task_description || null,
        task_description: taskForm.task_description || null,
        // optional task metadata
        task_type: taskForm.task_type || null,
        assigned_to: taskForm.assigned_to || null,
        status: taskForm.status || null,
        due_date: taskForm.due_date || null,
        time: taskForm.time || null,
        // lead-like fields copied from Add Lead form (exclude email, source, interested_in per request)
        address: taskForm.address || null,
        next_followup_date: taskForm.next_followup_date || null,
        next_followup_time: taskForm.next_followup_time || null,
        lead_status: taskForm.lead_status || 'new',
          created_by_user: null,
      };

      if (editingTaskId) {
        // Update existing task (use PATCH to avoid overwriting fields)
        await axios.patch(`http://127.0.0.1:8000/api/leads/update/${editingTaskId}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showAlert('success', 'Task updated');
      } else {
        // Create new task
        await axios.post(`http://127.0.0.1:8000/api/leads/create/`, { ...payload, created_by_user: getCurrentUserId() }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showAlert('success', 'Task created');
      }

      setShowAddTaskModal(false);
      setTaskForm({
        mode: 'customer',
        customer_full_name: '',
        contact_number: '',
        whatsapp_number: '',
        address: '',
        next_followup_date: '',
        next_followup_time: '',
        task_description: '',
        task_type: 'call',
        assigned_to: '',
        status: 'pending',
        due_date: '',
        time: '',
      });
      setEditingTaskId(null);

      // refresh lists
      fetchLeads();
      fetchTasks();
      fetchLoans();
    } catch (error) {
      console.error('Failed to create task:', error);
      showAlert('danger', 'Failed to create task');
    }
  };

  // Reset form
  const resetForm = () => {
    setLeadForm({
      customer_full_name: "",
      passport_number: "",
      passport_expiry: "",
      contact_number: "",
      email: "",
      cnic_number: "",
      address: "",
      branch_id: "",
      lead_source: "walk-in",
      lead_status: "new",
      interested_in: "umrah",
      interested_travel_date: "",
      next_followup_date: "",
      next_followup_time: "",
      remarks: "",
      last_contacted_date: "",
      loan_promise_date: "",
      loan_status: "pending",
      recovered_amount: "",
      recovery_date: "",
      loan_remarks: "",
      conversion_status: "not_converted",
      whatsapp_number: "",
    });
    setValidationErrors({});
    setCreateLoanWithLead(false);
    setChatMessages([]);
    setChatInput("");
  };

  // Open edit modal
  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setLeadForm(lead);
    setValidationErrors({});
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (lead) => {
    // Fetch full lead detail (includes nested followups) before showing modal
    (async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`http://127.0.0.1:8000/api/leads/${lead.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { organization: organizationId },
        });
        const data = resp.data || lead;
        // If backend returned created_by_user as an id, fetch that user's details to show username
        try {
          if (data && data.created_by_user && (typeof data.created_by_user === 'number' || typeof data.created_by_user === 'string')) {
            const uid = Number(data.created_by_user);
            if (!isNaN(uid)) {
              const uresp = await axios.get(`http://127.0.0.1:8000/api/users/${uid}/`, { headers: { Authorization: `Bearer ${token}` } });
              data.created_by_user = uresp.data || data.created_by_user;
              data.created_by_username = data.created_by_username || (uresp.data && (uresp.data.username || uresp.data.name));
            }
          }
        } catch (uu) {
          // ignore user fetch errors
        }
        // normalize branch name if available
        data.branch_name = data.branch_name || (data.branch?.name) || (typeof data.branch === 'number' ? (branches.find(b => Number(b.id) === Number(data.branch)) || {}).name : data.branch);
        setSelectedLead(data);
      } catch (err) {
        console.error('Failed to fetch lead details:', err);
        // fallback to provided lead object
        const l = { ...lead };
        l.branch_name = l.branch_name || (l.branch?.name) || (typeof l.branch === 'number' ? (branches.find(b => Number(b.id) === Number(l.branch)) || {}).name : l.branch);
        // If provided lead contains created_by_user id, try to fetch username (best-effort)
        try {
          if (l && l.created_by_user && (typeof l.created_by_user === 'number' || typeof l.created_by_user === 'string')) {
            const uid = Number(l.created_by_user);
            if (!isNaN(uid)) {
              const uresp = await axios.get(`http://127.0.0.1:8000/api/users/${uid}/`, { headers: { Authorization: `Bearer ${token}` } });
              l.created_by_user = uresp.data || l.created_by_user;
              l.created_by_username = l.created_by_username || (uresp.data && (uresp.data.username || uresp.data.name));
            }
          }
        } catch (uu) { }
        setSelectedLead(l);
      } finally {
        setLoading(false);
        setShowViewModal(true);
      }
    })();
  };

  // Open view modal for task (map task to selectedLead-like structure)
  const openViewTaskModal = (task) => {
    // Try to fetch full detail for this task/lead so view modal has all fields (whatsapp, created_by, created_at, loan info)
    (async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`http://127.0.0.1:8000/api/leads/${task.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { organization: organizationId },
        });
        const data = resp.data || task;
        // If backend returned created_by_user as an id, fetch that user's details to show username
        try {
          if (data && data.created_by_user && (typeof data.created_by_user === 'number' || typeof data.created_by_user === 'string')) {
            const uid = Number(data.created_by_user);
            if (!isNaN(uid)) {
              const uresp = await axios.get(`http://127.0.0.1:8000/api/users/${uid}/`, { headers: { Authorization: `Bearer ${token}` } });
              data.created_by_user = uresp.data || data.created_by_user;
              data.created_by_username = data.created_by_username || (uresp.data && (uresp.data.username || uresp.data.name));
            }
          }
        } catch (uu) { }

        data.branch_name = data.branch_name || (data.branch?.name) || (typeof data.branch === 'number' ? (branches.find(b => Number(b.id) === Number(data.branch)) || {}).name : data.branch);
        setSelectedLead(data);
      } catch (err) {
        // fallback to a minimal mapping if fetch fails
        const mapped = {
          id: task.id,
          customer_full_name: task.customer_full_name || "",
          contact_number: task.contact_number || null,
          whatsapp_number: task.whatsapp_number || task.whatsapp || task.contact_number || null,
          email: task.email || null,
          address: task.address || null,
          branch_name: task.branch_name || task.branch?.name || (task.branch || task.branch_id ? (branches.find(b => Number(b.id) === Number(task.branch || task.branch_id)) || {}).name : ''),
          lead_source: task.lead_source || null,
          lead_status: task.lead_status || task.status || null,
          interested_in: task.interested_in || null,
          interested_travel_date: task.interested_travel_date || null,
          conversion_status: task.conversion_status || null,
          next_followup_date: task.due_date || task.next_followup_date || task.due_date || null,
          next_followup_time: task.time || task.next_followup_time || null,
          loan_promise_date: task.loan_promise_date || task.due_date || null,
          loan_status: task.loan_status || task.status || null,
          remarks: task.remarks || task.task_description || null,
          created_by_user: task.created_by_user || task.created_by || null,
          created_at: task.created_at || task.created_on || null,
        };
        setSelectedLead(mapped);
      } finally {
        setLoading(false);
        setShowViewModal(true);
      }
    })();
  };

  const openEditTask = (task) => {
    // Populate taskForm and open task modal for editing
    setTaskForm({
      mode: task.is_internal ? 'internal' : 'customer',
      customer_full_name: task.customer_full_name || "",
      contact_number: task.contact_number || "",
      whatsapp_number: task.whatsapp_number || task.whatsapp || "",
      email: task.email || "",
      task_description: task.remarks || "",
      task_type: task.task_type || task.type || 'call',
      assigned_to: task.assigned_to || task.assigned_to_id || '',
      status: task.status || 'pending',
      lead_status: task.lead_status || 'new',
      loan_status: task.loan_status || (task.status ? (task.status === 'completed' ? 'cleared' : task.status === 'overdue' ? 'overdue' : 'pending') : 'pending'),
      due_date: task.due_date || "",
      time: task.time || "",
    });
    setEditingTaskId(task.id);
    setShowAddTaskModal(true);
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showAlert('success', 'Task deleted');
  };

  // Open delete modal
  const openDeleteModal = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statuses = {
      new: { bg: "info", label: "New" },
      followup: { bg: "warning", label: "Follow-up" },
      confirmed: { bg: "success", label: "Confirmed" },
      lost: { bg: "danger", label: "Lost" },
    };
    return statuses[status] || { bg: "secondary", label: status };
  };

  // Get conversion badge
  const getConversionBadge = (status) => {
    const statuses = {
      not_converted: { bg: "secondary", label: "Not Converted" },
      converted_to_booking: { bg: "success", label: "Converted" },
      lost: { bg: "danger", label: "Lost" },
    };
    return statuses[status] || { bg: "secondary", label: status };
  };

  // Get loan status badge
  const getLoanStatusBadge = (status) => {
    const statuses = {
      pending: { bg: "warning", label: "Pending" },
      cleared: { bg: "success", label: "Cleared" },
      overdue: { bg: "danger", label: "Overdue" },
    }

    return statuses[status] || { bg: "secondary", label: status };
  };

  // Map loan_status back to task-style status for display
  const mapLoanStatusToTaskStatus = (loanStatus) => {
    if (!loanStatus) return 'pending';
    if (loanStatus === 'cleared') return 'completed';
    if (loanStatus === 'overdue') return 'overdue';
    return 'pending';
  };

  const getTaskDisplayStatus = (task) => {
    // prefer explicit task.status if it's set to something meaningful
    if (task?.status && task.status !== 'pending') return task.status;
    if (task?.loan_status) return mapLoanStatusToTaskStatus(task.loan_status);
    return task?.status || 'pending';
  };

  const getTaskStatusBadge = (status) => {
    if (status === 'completed') return { bg: 'success', label: 'Completed' };
    if (status === 'overdue') return { bg: 'danger', label: 'Overdue' };
    return { bg: 'warning', label: status };
  };


  // Calculate statistics
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.lead_status === "new").length,
    converted: leads.filter((l) => l.conversion_status === "converted_to_booking").length,
    walkin: leads.filter((l) => ((l.lead_source || l.source || '')).toString().toLowerCase() === 'walk-in' || ((l.lead_source || l.source || '')).toString().toLowerCase() === 'walkin').length,
    conversionRate:
      leads.length > 0
        ? Math.round(
          (leads.filter((l) => l.conversion_status === "converted_to_booking").length /
            leads.length) *
          100
        )
        : 0,
  };

  // Styling with Fixes for Dropdown Overlap
  const tableStyles = `
    .lead-management-table th,
    .lead-management-table td {
      white-space: nowrap;
      vertical-align: middle;
    }
    .lead-management-table th:first-child,
    .lead-management-table td:first-child {
      position: sticky;
      left: 0;
      background-color: white;
      z-index: 1;
    }
    .lead-management-table thead th:first-child { z-index: 2; }
    .lead-management-table th {
      background: #1B78CE !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 12px !important;
      border: none !important;
      font-size: 0.9rem !important;
    }
    .lead-management-table td {
      padding: 12px !important;
      border-bottom: 1px solid #dee2e6 !important;
      font-size: 0.85rem !important;
    }
    .lead-management-table tbody tr:hover { background-color: #f8fafc !important; }
    .stat-card { border-radius: 6px; }
    
    /* Make toggle visible but not above menu */
.lead-management-table .dropdown-toggle {
  border: none !important;
  background: transparent !important;
  color: #6c757d !important;
  padding: 4px !important;
  border-radius: 4px !important;
  width: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 10 !important;
  position: relative !important;
} 
    .lead-management-table .dropdown-toggle:hover {
      background: #e9ecef !important;
      color: #495057 !important;
      z-index: 10 !important;
    }
    .lead-management-table .dropdown-toggle:focus {
      box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.25) !important;
    }
    /* Dropdown Menu Always on Top */
.lead-management-table .dropdown-menu {
  min-width: 120px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 4px 0;
  z-index: 9999 !important;
  position: absolute !important;
}

    .lead-management-table .dropdown-item {
      padding: 8px 16px;
      font-size: 0.85rem;
      color: #495057;
      transition: all 0.2s ease;
    }
    .lead-management-table .dropdown-item:hover {
      background-color: #f8f9fa;
      color: #212529;
      z-index: 3000 !important;
    }
    .lead-management-table .dropdown-item svg {
      margin-right: 8px;
    }
    /* Ensure dropdown container doesn't clip */
    .lead-management-table td:last-child {
      position: relative; 
      width: 60px;
      min-width: 60px;
      text-align: center;
      overflow: visible !important;
    }
      /* Make last column not clip */
.lead-management-table td:last-child {
  position: relative !important; 
  overflow: visible !important;
  z-index: 1 !important;
}
    .table-responsive {
      overflow-x: auto; 
      -webkit-overflow-scrolling: touch;
      /* Ensure vertical overflow isn't hidden if table is short */
      min-height: 300px; 
    }

    /* Responsive adjustments */
    @media (max-width: 991px) {
      .page-hero h1 { font-size: 1.35rem; }
      .lead-management-table th, .lead-management-table td { padding: 8px !important; font-size: 0.8rem !important; }
      .stat-card .icon { width: 22px; height: 22px; }
      .stat-card h4, .stat-card h3, .stat-card h5 { font-size: 1rem; }
    }
    @media (max-width: 768px) {
      .stat-card { margin-bottom: 8px; }
      .stat-card .card-body { display:flex; align-items:center; justify-content:space-between; }
      .stat-card .value { font-size:1rem; }
      .page-subtitle { font-size: 0.92rem; }
      .lead-management-table th:first-child,
      .lead-management-table td:first-child { position: static; left: auto; z-index: auto; background: transparent; }
      .lead-management-table th, .lead-management-table td { white-space: normal; }
      .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    }
    @media (max-width: 480px) {
      .lead-management-table th, .lead-management-table td { padding: 6px !important; font-size: 0.75rem !important; }
      .stat-card .icon { width: 18px; height: 18px; }
      .page-hero h1 { font-size: 1.1rem; }
      .page-hero .page-subtitle { display: none; }
    }
    .stat-card { border-radius: 6px; box-shadow: 0 1px 4px rgba(23, 43, 77, 0.04); padding: 0; }
    .stat-card .card-body { padding: 12px 14px; }
    .stat-card p.text-muted { margin-bottom: 4px; font-size: 0.85rem; }
    .stat-card h4, .stat-card h3, .stat-card h5 { margin: 0; }
    .stat-card .icon { opacity: 0.9; }
    .loan-stat .card-body, .task-stat .card-body { display:flex; justify-content:space-between; align-items:center; }
    .loan-stat .value, .task-stat .value { font-weight:700; }
    .lead-management-nav .nav-link { padding: 0.35rem 0.75rem; font-size: 0.95rem; }
  `;

  // Additional styles for followup/chat bubbles
  const followupStyles = `
    .followup-history { padding: 8px; }
    .followup-bubble { background: #e9f2ff; padding: 10px 12px; border-radius: 12px; max-width: 78%; margin-left: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .followup-meta { font-size: 0.78rem; color: #6c757d; margin-bottom: 6px; display:flex; justify-content:space-between; }
    .followup-list-item { margin-bottom: 10px; }
  `;
  /* Compact modal styles */
  const compactModalStyles = `
    .compact-modal .modal-dialog { max-width: 680px; }
    .compact-modal .modal-header { padding: 0.5rem 0.75rem; }
    .compact-modal .modal-body { max-height: 60vh; overflow-y: auto; padding: 0.75rem 0.9rem; }
    .compact-modal .modal-footer { padding: 0.5rem 0.75rem; }
    .compact-modal .modal-title { font-size: 1rem; }
  `;

  return (
    <div className="d-flex">

      <div className="flex-grow-1">


        <div className="page-inner" style={{ margin: 0, padding: 0 }}>
          <Container fluid className=" ">
            {/* Page Header */}
            <div className="row mb-3">
              <div className="col-12">
                <h4 className="mb-1" style={{ color: '#1B78CE', fontWeight: '600' }}>Follow-up Dashboard</h4>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Overview of leads and quick follow-up actions — focus on today's priorities and convert faster.</p>
              </div>
            </div>
            {/* Alert */}
            <style dangerouslySetInnerHTML={{ __html: tableStyles }} />
            {alert.show && (
              <Alert
                variant={alert.type}
                dismissible
                onClose={() => setAlert({ ...alert, show: false })}
                style={{ borderLeft: `6px solid ${alert.type === 'success' ? '#28a745' : alert.type === 'danger' ? '#dc3545' : '#1B78CE'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div style={{ fontWeight: 600 }}>{alert.message}</div>
              </Alert>
            )}

            {/* Main Content Card */}
            <Card className="border-0 shadow-sm">

              <Card.Body className="p-0">
                {/* Styled nav */}
                <div className="row mb-3">
                  <div className="col-12">
                    <nav>
                      <div className="nav d-flex flex-wrap gap-2 lead-management-nav">
                        <button
                          className={`nav-link btn btn-link ${activeTab === 'leads' ? 'fw-bold' : ''}`}
                          onClick={() => setActiveTab('leads')}
                          style={{
                            color: activeTab === 'leads' ? '#1B78CE' : '#6c757d',
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: 'Poppins, sans-serif',
                            borderBottom: activeTab === 'leads' ? '2px solid #1B78CE' : '2px solid transparent'
                          }}
                        >
                          <FileText size={16} className="me-2" />
                          Leads
                        </button>
                        <button
                          className={`nav-link btn btn-link ${activeTab === 'loans' ? 'fw-bold' : ''}`}
                          onClick={() => setActiveTab('loans')}
                          style={{
                            color: activeTab === 'loans' ? '#1B78CE' : '#6c757d',
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: 'Poppins, sans-serif',
                            borderBottom: activeTab === 'loans' ? '2px solid #1B78CE' : '2px solid transparent'
                          }}
                        >
                          <DollarSign size={16} className="me-2" />
                          Loans
                        </button>
                        <button
                          className={`nav-link btn btn-link ${activeTab === 'tasks' ? 'fw-bold' : ''}`}
                          onClick={() => setActiveTab('tasks')}
                          style={{
                            color: activeTab === 'tasks' ? '#1B78CE' : '#6c757d',
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: 'Poppins, sans-serif',
                            borderBottom: activeTab === 'tasks' ? '2px solid #1B78CE' : '2px solid transparent'
                          }}
                        >
                          <BarChart3 size={16} className="me-2" />
                          Tasks
                        </button>
                        <button
                          className={`nav-link btn btn-link ${activeTab === 'followups' ? 'fw-bold' : ''}`}
                          onClick={() => setActiveTab('followups')}
                          style={{
                            color: activeTab === 'followups' ? '#1B78CE' : '#6c757d',
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: 'Poppins, sans-serif',
                            borderBottom: activeTab === 'followups' ? '2px solid #1B78CE' : '2px solid transparent'
                          }}
                        >
                          <Clock size={16} className="me-2" />
                          Follow-ups
                        </button>
                      </div>
                    </nav>
                  </div>
                </div>

                {/* Content based on Active Tab */}

                {/* Leads Content */}
                {activeTab === 'leads' && (
                  <>
                    <div className="p-3">
                      <Row className="mb-4">
                        <Col xs={12} sm={6} lg={3} className="mb-3">
                          <Card className="stat-card h-10 p-2" style={{ borderLeft: '4px solid #1B78CE' }}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="text-muted mb-1">Total Leads</p>
                                  <h3 className="mb-0" style={{ color: '#1B78CE' }}>{stats.total}</h3>
                                </div>
                                <BarChart3 size={32} style={{ color: '#1B78CE', opacity: 0.8 }} />
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col xs={12} sm={6} lg={3} className="mb-3">
                          <Card className="stat-card h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="text-muted mb-1">New Leads</p>
                                  <h3 className="mb-0" style={{ color: '#ffc107' }}>{stats.new}</h3>
                                </div>
                                <AlertCircle size={32} style={{ color: '#ffc107', opacity: 0.8 }} />
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col xs={12} sm={6} lg={3} className="mb-3">
                          <Card className="stat-card h-100" style={{ borderLeft: '4px solid #6f42c1' }}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="text-muted mb-1">Walk-in Leads</p>
                                  <h3 className="mb-0" style={{ color: '#6f42c1' }}>{stats.walkin}</h3>
                                </div>
                                <User size={32} style={{ color: '#6f42c1', opacity: 0.85 }} />
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col xs={12} sm={6} lg={3} className="mb-3">
                          <Card className="stat-card h-100" style={{ borderLeft: '4px solid #28a745' }}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="text-muted mb-1">Converted</p>
                                  <h3 className="mb-0" style={{ color: '#28a745' }}>{stats.converted}</h3>
                                </div>
                                <CheckCircle size={32} style={{ color: '#28a745', opacity: 0.8 }} />
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col xs={12} sm={6} lg={3} className="mb-3">
                          <Card className="stat-card h-100" style={{ borderLeft: '4px solid #17a2b8' }}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="text-muted mb-1">Conversion Rate</p>
                                  <h3 className="mb-0" style={{ color: '#17a2b8' }}>{stats.conversionRate}%</h3>
                                </div>
                                <TrendingUp size={32} style={{ color: '#17a2b8', opacity: 0.8 }} />
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                          {/* Filters & Search */}
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <InputGroup style={{ maxWidth: '300px' }} size="sm">
                              <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="Search leads..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                style={{ border: '1px solid #dee2e6', maxWidth: 300 }}
                              />
                            </InputGroup>
                            <Form.Select size="sm" value={filters.lead_status} onChange={(e) => setFilters({ ...filters, lead_status: e.target.value })} style={{ minWidth: 140, maxWidth: 180 }}>
                              <option value="">All Status</option>
                              <option value="new">New</option>
                              {/* <option value="followup">Follow-up</option> */}
                              <option value="confirmed">Confirmed</option>
                              <option value="lost">Lost</option>
                            </Form.Select>
                            <Form.Select size="sm" value={filters.interested_in} onChange={(e) => setFilters({ ...filters, interested_in: e.target.value })} style={{ minWidth: 140, maxWidth: 180 }}>
                              <option value="">All Services</option>
                              <option value="ticket">Ticket</option>
                              <option value="umrah">Umrah Package</option>
                              <option value="visa">Visa</option>
                              <option value="transport">Transport</option>
                              <option value="hotel">Hotel</option>
                            </Form.Select>
                            <Form.Select
                              size="sm"
                              value={filters.conversion_status}
                              onChange={(e) => setFilters({ ...filters, conversion_status: e.target.value })}
                              style={{ minWidth: 100, maxWidth: 140 }}
                            >
                              <option value="">All Conversions</option>
                              <option value="not_converted">Not Converted</option>
                              <option value="converted_to_booking">Converted</option>
                              <option value="lost">Lost</option>
                            </Form.Select>
                            <Form.Select
                              size="sm"
                              value={filters.lead_source}
                              onChange={(e) => setFilters({ ...filters, lead_source: e.target.value })}
                              style={{ minWidth: 100, maxWidth: 140 }}
                            >
                              <option value="">All Sources</option>
                              <option value="walk-in">Walk-in</option>
                              <option value="call">Call</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="facebook">Facebook</option>
                              <option value="referral">Referral</option>
                            </Form.Select>
                            <Form.Check
                              type="checkbox"
                              id="leads-today-followups"
                              label="Today's follow-ups"
                              checked={!!filters.today_followups}
                              onChange={(e) => setFilters({ ...filters, today_followups: e.target.checked })}
                              className="ms-2"
                            />
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                setFilters({
                                  search: "",
                                  lead_status: "",
                                  conversion_status: "",
                                  branch_id: "",
                                  interested_in: "",
                                  lead_source: "",
                                  today_followups: false,
                                });
                              }}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              Clear Filters
                            </Button>
                          </div>
                          {/* Add Lead Button */}
                          <Button
                            style={{ backgroundColor: '#1B78CE', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => setShowAddModal(true)}
                          >
                            <Plus size={16} className="me-1" />
                            Add Lead
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Loading */}
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                      </div>
                    ) : paginatedLeads.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No leads found</p>
                      </div>
                    ) : (
                      <>
                        {/* Table */}
                        <div className="table-responsive">
                          <Table hover className="mb-0 lead-management-table">
                            <thead className="bg-light">
                              <tr>
                                <th className="text-nowrap">Name</th>
                                <th className="text-nowrap">Contact</th>

                                <th className="text-nowrap">Lead Status</th>
                                <th className="text-nowrap">Interested In</th>
                                <th className="text-nowrap">Source</th>
                                <th className="text-nowrap">Conversion</th>
                                <th className="text-nowrap">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedLeads.map((lead) => (
                                <tr key={lead.id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                        style={{ width: "32px", height: "32px", marginRight: "8px" }}
                                      >
                                        <User size={16} />
                                      </div>
                                      <div>
                                        <p className="mb-0 fw-500" style={{ cursor: 'pointer' }} onClick={() => openViewModal(lead)}>{lead.customer_full_name}</p>
                                        <small className="text-muted">{lead.passport_number}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-nowrap">
                                    <div>
                                      <p className="mb-0 d-flex align-items-center">
                                        <Phone size={14} className="me-2 text-muted" />
                                        {lead.contact_number}
                                      </p>
                                      <small className="text-muted d-flex align-items-center">
                                        <Mail size={14} className="me-2" />
                                        {lead.email}
                                      </small>
                                    </div>
                                  </td>

                                  <td>
                                    <Badge bg={getStatusBadge(lead.lead_status).bg}>
                                      {getStatusBadge(lead.lead_status).label}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg="info">
                                      {lead.interested_in === "umrah"
                                        ? "Umrah"
                                        : (lead.interested_in ? lead.interested_in.charAt(0).toUpperCase() + lead.interested_in.slice(1) : "-")}
                                    </Badge>
                                  </td>
                                  <td>
                                    <small className="text-capitalize">{lead.lead_source}</small>
                                  </td>
                                  <td>
                                    <Badge bg={getConversionBadge(lead.conversion_status).bg}>
                                      {getConversionBadge(lead.conversion_status).label}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Dropdown>
                                      <Dropdown.Toggle variant="link" size="sm" className="p-0 border-0">
                                        <MoreVertical size={16} />
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu align="end">
                                        <Dropdown.Item onClick={() => openViewModal(lead)}>
                                          <Eye size={14} className="me-2" /> View
                                        </Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={() => openCloseLeadModal(lead)}>
                                          <CheckCircle size={14} className="me-2" /> {isTaskRecord(lead) ? 'Close Task' : 'Close Lead'}
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => openAddRemarksModal(lead)}>
                                          <FileText size={14} className="me-2" /> Add Remarks
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => openNextFollowupModal(lead)}>
                                          <Clock size={14} className="me-2" /> Next Follow up
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="p-3 border-top d-flex justify-content-center">
                            <Pagination size="sm" className="mb-0">
                              <Pagination.First
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              />
                              <Pagination.Prev
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                              />
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page;
                                if (totalPages <= 5) {
                                  page = i + 1;
                                } else if (currentPage <= 3) {
                                  page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  page = totalPages - 4 + i;
                                } else {
                                  page = currentPage - 2 + i;
                                }
                                return (
                                  <Pagination.Item
                                    key={page}
                                    active={page === currentPage}
                                    onClick={() => setCurrentPage(page)}
                                  >
                                    {page}
                                  </Pagination.Item>
                                );
                              })}
                              <Pagination.Next
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              />
                              <Pagination.Last
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                              />
                            </Pagination>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Follow-ups Content */}
                {activeTab === 'followups' && (
                  <div className="p-3">
                    <div className="row mb-3">
                      <div className="col-12 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Overdue Follow-ups</h5>
                        <small className="text-muted">Showing overdue follow-ups (excluding Lost/Confirmed)</small>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <Table hover className="mb-0 lead-management-table">
                        <thead className="bg-light">
                          <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Next Follow-up</th>
                            <th>Days Overdue</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const today = new Date();
                            const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                            const isOverdue = (dateStr, status) => {
                              try {
                                if (!dateStr) return false;
                                const nd = normalizeDateYMD(dateStr);
                                if (!nd) return false;
                                if (nd >= todayStr) return false;
                                if (status && ['lost','confirmed'].includes(status)) return false;
                                return true;
                              } catch (e) { return false; }
                            };

                            const items = [];

                            (leads || []).forEach((l) => {
                              if (isOverdue(l.next_followup_date, l.lead_status)) items.push({ ...l, __source: 'lead', __followup_date: l.next_followup_date });
                            });

                            (tasks || []).forEach((t) => {
                              const due = t.next_followup_date || t.due_date || t.followup_date || null;
                              if (isOverdue(due, t.lead_status)) items.push({ ...t, __source: 'task', __followup_date: due });
                            });

                            (loans || []).forEach((ln) => {
                              const due = ln.loan_promise_date || ln.due_date || ln.next_followup_date || null;
                              if (isOverdue(due, ln.loan_status)) items.push({ ...ln, __source: 'loan', __followup_date: due });
                            });

                            items.sort((a, b) => {
                              try {
                                const ad = new Date(normalizeDateYMD(a.__followup_date));
                                const bd = new Date(normalizeDateYMD(b.__followup_date));
                                return ad - bd;
                              } catch (e) { return 0; }
                            });

                            return items.map(item => {
                              const nd = normalizeDateYMD(item.__followup_date) || '-';
                              const daysOverdue = (() => {
                                try {
                                  const a = new Date(normalizeDateYMD(item.__followup_date));
                                  const b = new Date();
                                  const diff = Math.floor((b - a)/(1000*60*60*24));
                                  return diff > 0 ? diff : 0;
                                } catch (e) { return '-'; }
                              })();

                              const onView = () => {
                                if (item.__source === 'task') return openViewTaskModal(item);
                                return openViewModal(item);
                              };

                              return (
                                <tr key={`${item.__source}-${item.id}`}>
                                  <td style={{ cursor: 'pointer' }} onClick={onView}>{item.customer_full_name || item.title || item.name || '—'}</td>
                                  <td>{item.contact_number || item.whatsapp_number || '-'}</td>
                                  <td>{nd}</td>
                                  <td>{daysOverdue}</td>
                                  <td>
                                    <Badge bg={item.__source === 'task' ? 'primary' : (item.__source === 'loan' ? 'info' : 'secondary')} className="me-2 text-capitalize">{item.__source}</Badge>
                                    <Dropdown>
                                      <Dropdown.Toggle size="sm" variant="outline-primary">Actions</Dropdown.Toggle>
                                      <Dropdown.Menu>
                                        <Dropdown.Item onClick={onView}><Eye size={14} className="me-1" /> View</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openAddRemarksModal(item)}>Add Remarks</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openNextFollowupModal(item)}>Next Follow Up</Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={() => openCloseLeadModal(item)} className="text-danger">{isTaskRecord(item) ? 'Close Task' : 'Close Lead'}</Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Loans Content */}
                {activeTab === 'loans' && (
                  <div className="p-3">
                    {/* Loan Stats */}
                    <Row className="mb-3">
                      <Col xs={12} md={3} className="mb-2">
                        <Card className="stat-card loan-stat h-100" style={{ borderLeft: '4px solid #1B78CE' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Total Loan Amount</p>
                              <div className="value">Rs. {loans.reduce((s, l) => s + getLoanAmount(l), 0).toLocaleString()}</div>
                            </div>
                            <DollarSign size={28} className="icon" style={{ color: '#1B78CE' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={12} md={3} className="mb-2">
                        <Card className="stat-card loan-stat h-100" style={{ borderLeft: '4px solid #17a2b8' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Loan Persons</p>
                              <div className="value">{loans.length}</div>
                            </div>
                            <User size={26} className="icon" style={{ color: '#17a2b8' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={12} md={3} className="mb-2">
                        <Card className="stat-card loan-stat h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Total Recovery Pending</p>
                              <div className="value">Rs. {loans.reduce((s, l) => s + (getLoanAmount(l) - getRecoveredAmount(l)), 0).toLocaleString()}</div>
                            </div>
                            <TrendingUp size={26} className="icon" style={{ color: '#ffc107' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={12} md={3} className="mb-2">
                        <Card className="stat-card loan-stat h-100" style={{ borderLeft: '4px solid #28a745' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Today Recover / Today Recovered</p>
                              <div className="value">{(() => { const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const todayDue = loans.filter(l => getLoanDueDate(l) === today).reduce((s, l) => s + getLoanAmount(l), 0); const todayRecovered = loans.filter(l => getRecoveryDate(l) === today).reduce((s, l) => s + getRecoveredAmount(l), 0); return `${todayDue.toLocaleString()} / ${todayRecovered.toLocaleString()}` })()}</div>
                            </div>
                            <CheckCircle size={26} className="icon" style={{ color: '#28a745' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    {/* Filters, Search, Add Loan Button */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                          {/* Filters & Search */}
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <InputGroup style={{ maxWidth: '300px' }} size="sm">
                              <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="Search loans..."
                                value={loanFilters?.search || ''}
                                onChange={(e) => setLoanFilters({ ...loanFilters, search: e.target.value })}
                                style={{ border: '1px solid #dee2e6', maxWidth: 300 }}
                              />
                            </InputGroup>
                            <Form.Select size="sm" value={loanFilters?.status || ''} onChange={(e) => setLoanFilters({ ...loanFilters, status: e.target.value })} style={{ minWidth: 140, maxWidth: 180 }}>
                              <option value="">All Status</option>
                              <option value="pending">Pending</option>
                              <option value="cleared">Cleared</option>
                              <option value="overdue">Overdue</option>
                            </Form.Select>
                            {/* Branch filter removed per request */}
                            <Form.Check
                              type="checkbox"
                              id="loans-today-followups"
                              label="Today's follow-ups"
                              checked={!!loanFilters?.today_followups}
                              onChange={(e) => setLoanFilters({ ...loanFilters, today_followups: e.target.checked })}
                              className="ms-2"
                            />
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setLoanFilters({ search: '', status: '', branch_id: '', today_followups: false })}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              Clear Filters
                            </Button>
                          </div>
                          {/* Add Loan Button */}
                          <Button
                            style={{ backgroundColor: '#1B78CE', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => setShowAddLoanModal(true)}
                          >
                            <Plus size={16} className="me-1" />
                            Add Loan
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Loans Table */}
                    <div className="table-responsive">
                      <Table hover className="mb-0 lead-management-table">
                        <thead className="bg-light">
                          <tr>
                            <th>Customer</th>
                            <th>Contact</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Recovered</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLoans.map(loan => (
                            <tr key={loan.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, marginRight: 8 }}>
                                    <User size={14} />
                                  </div>
                                  <div>
                                    <div className="fw-500">{loan.customer_full_name}</div>
                                    <small className="text-muted">{loan.branch_name}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{loan.contact_number}<br /><small className="text-muted">{loan.email}</small></td>
                              <td>Rs. {getLoanAmount(loan).toLocaleString()}</td>
                              <td>{getLoanDueDate(loan) || loan.due_date || loan.loan_promise_date || '-'}</td>
                              <td>{loan.reason || loan.remarks || loan.loan_remarks}</td>
                              <td><Badge bg={(loan.loan_status || loan.status) === 'pending' ? 'warning' : (loan.loan_status || loan.status) === 'cleared' ? 'success' : 'danger'}>{loan.loan_status || loan.status}</Badge></td>
                              <td>Rs. {getRecoveredAmount(loan).toLocaleString()}</td>
                              <td>
                                <Dropdown>
                                  <Dropdown.Toggle variant="link" size="sm" className="p-0 border-0">
                                    <MoreVertical size={16} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu align="end">
                                    <Dropdown.Item onClick={() => handleLoanAddRemarks(loan)}>
                                      <FileText size={14} className="me-2" /> Add Remarks
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => openAddBalanceModal(loan)}>
                                      <DollarSign size={14} className="me-2" /> Add Balance
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => openRescheduleLoanModal(loan)}>
                                      <Clock size={14} className="me-2" /> Reschedule
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => openClearLoanModal(loan)}>
                                      <CheckCircle size={14} className="me-2" /> Clear Loan
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => openViewModal({ ...loan, loan_status: loan.status, loan_promise_date: loan.due_date })}>
                                      <Eye size={14} className="me-2" /> View
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Tasks Content */}
                {activeTab === 'tasks' && (
                  <div className="p-3">
                    <Row className="mb-4">
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <Card className="stat-card task-stat h-100 p-2" style={{ borderLeft: '4px solid #1B78CE' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Total Tasks</p>
                              <div className="value">{tasks.length}</div>
                            </div>
                            <BarChart3 size={28} className="icon" style={{ color: '#1B78CE' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <Card className="stat-card task-stat h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Pending</p>
                              <div className="value">{tasks.filter(t => getTaskDisplayStatus(t) === 'pending').length}</div>
                            </div>
                            <Clock size={26} className="icon" style={{ color: '#ffc107' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <Card className="stat-card task-stat h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Overdue</p>
                              <div className="value">{tasks.filter(t => getTaskDisplayStatus(t) === 'overdue').length}</div>
                            </div>
                            <AlertCircle size={26} className="icon" style={{ color: '#dc3545' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <Card className="stat-card task-stat h-100" style={{ borderLeft: '4px solid #6f42c1' }}>
                          <Card.Body>
                            <div>
                              <p className="text-muted mb-1">Internal Tasks</p>
                              <div className="value">{tasks.filter(t => !!t.is_internal).length}</div>
                            </div>
                            <FileText size={26} className="icon" style={{ color: '#6f42c1' }} />
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    {/* Filters, Search, Add Task Button */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                          {/* Filters & Search */}
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <InputGroup style={{ maxWidth: '250px' }} size="sm">
                              <InputGroup.Text style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                                <Search size={16} />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="Search tasks..."
                                value={taskFilters?.search || ''}
                                onChange={(e) => setTaskFilters({ ...taskFilters, search: e.target.value })}
                                style={{ border: '1px solid #dee2e6' }}
                              />
                            </InputGroup>
                            <Form.Select size="sm" value={taskFilters?.status || ''} onChange={(e) => setTaskFilters({ ...taskFilters, status: e.target.value })} style={{ minWidth: 140, maxWidth: 180 }}>
                              <option value="">All Status</option>
                              <option value="pending">Pending</option>
                              <option value="overdue">Overdue</option>
                              <option value="completed">Completed</option>
                            </Form.Select>
                            {/* Branch filter removed per request */}
                            <Form.Check
                              type="checkbox"
                              id="tasks-today-followups"
                              label="Today's follow-ups"
                              checked={!!taskFilters?.today_followups}
                              onChange={(e) => setTaskFilters({ ...taskFilters, today_followups: e.target.checked })}
                              className="ms-2"
                            />
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setTaskFilters({ search: '', status: '', branch_id: '', today_followups: false })}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              Clear Filters
                            </Button>
                          </div>
                          {/* Add Task Button */}
                          <Button
                            style={{ backgroundColor: '#1B78CE', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => { setEditingTaskId(null); setTaskForm({ mode: 'customer', customer_full_name: '', contact_number: '', whatsapp_number: '', email: '', task_description: '', task_type: 'call', assigned_to: '', status: 'pending', due_date: '', time: '' }); setShowAddTaskModal(true); }}
                          >
                            <Plus size={16} className="me-1" />
                            Add Task
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <Table hover className="mb-0 lead-management-table">
                        <thead className="bg-light">
                          <tr>
                            <th>Assigned To</th>
                            <th>Task Type</th>
                            <th>Lead Status</th>
                            <th>Due Date</th>
                            <th>Time</th>
                            <th>Remarks</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map(task => (
                            <tr key={task.id}>
                              <td>{task.assigned_to_name || task.assigned_to || <small className="text-muted">—</small>}</td>
                              <td className="text-capitalize">{task.task_type || task.type || '-'}</td>
                              <td><Badge bg={getStatusBadge(task.lead_status).bg}>{getStatusBadge(task.lead_status).label}</Badge></td>
                              <td>{task.due_date}</td>
                              <td>{task.time}</td>
                              <td>{task.remarks}</td>
                              {
                                (() => {
                                  const disp = getTaskDisplayStatus(task);
                                  const badge = getTaskStatusBadge(disp);
                                  return <td><Badge bg={badge.bg}>{badge.label}</Badge></td>;
                                })()
                              }
                              <td>
                                <Dropdown>
                                  <Dropdown.Toggle variant="link" size="sm" className="p-0 border-0">
                                    <MoreVertical size={16} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu align="end">
                                    <Dropdown.Item onClick={() => openViewTaskModal(task)}>
                                      <Eye size={14} className="me-2" /> View
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => openCloseLeadModal(task)}>
                                      <CheckCircle size={14} className="me-2" /> {isTaskRecord(task) ? 'Close Task' : 'Close Lead'}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => openAddRemarksModal(task)}>
                                      <FileText size={14} className="me-2" /> Add Remarks
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => openNextFollowupModal(task)}>
                                      <Clock size={14} className="me-2" /> Next Follow up
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => openEditTask(task)}>
                                      <Edit2 size={14} className="me-2" /> Edit
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => { setSelectedLead(task); setShowDeleteModal(true); }}>
                                      <Trash2 size={14} className="me-2" /> Delete
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}

              </Card.Body>
            </Card>
          </Container>
        </div>

        {/* Add/Edit Lead Modal */}
        <Modal show={showAddModal || showEditModal} onHide={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }} size="md" dialogClassName="compact-modal" centered>
          <Modal.Header closeButton>
            <Modal.Title>{showEditModal ? "Edit Lead" : "Add New Lead"}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="max-height-modal compact-modal-body">
            {/* Compact Add Form when adding new lead; full form when editing */}
            {showAddModal ? (
              <Form>
                <Row className="g-2">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-500">Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={leadForm.customer_full_name}
                        isInvalid={!!validationErrors.customer_full_name}
                        onChange={(e) => setLeadForm({ ...leadForm, customer_full_name: e.target.value })}
                        placeholder="Full name"
                      />
                      <Form.Control.Feedback type="invalid">Full name is required</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-500">Contact *</Form.Label>
                      <Form.Control
                        type="tel"
                        value={leadForm.contact_number}
                        isInvalid={!!validationErrors.contact_number}
                        onChange={(e) => setLeadForm({ ...leadForm, contact_number: e.target.value })}
                        placeholder="+92-300-1234567"
                      />
                      <Form.Control.Feedback type="invalid">Contact is required</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  

                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-500">WhatsApp Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={leadForm.whatsapp_number}
                        onChange={(e) => setLeadForm({ ...leadForm, whatsapp_number: e.target.value })}
                        placeholder="WhatsApp number (optional)"
                      />
                    </Form.Group>
                  </Col>


                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-500">Email</Form.Label>
                      <Form.Control type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="Email (optional)" />
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-500">Interested In</Form.Label>
                      <Form.Select size="md" value={leadForm.interested_in} onChange={(e) => setLeadForm({ ...leadForm, interested_in: e.target.value })}>
                        <option value="umrah">Umrah</option>
                        <option value="visa">Visa</option>
                        <option value="ticket">Ticket</option>
                        <option value="hotel">Hotel</option>
                        <option value="transport">Transport</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label className="fw-500">Follow-up Date *</Form.Label>
                      <Form.Control type="date" value={leadForm.next_followup_date} isInvalid={!!validationErrors.next_followup_date} onChange={(e) => setLeadForm({ ...leadForm, next_followup_date: e.target.value })} />
                      <Form.Control.Feedback type="invalid">Required</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label className="fw-500">Follow-up Time *</Form.Label>
                      <Form.Control type="time" value={leadForm.next_followup_time} isInvalid={!!validationErrors.next_followup_time} onChange={(e) => setLeadForm({ ...leadForm, next_followup_time: e.target.value })} />
                      <Form.Control.Feedback type="invalid">Required</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label className="fw-500">Source</Form.Label>
                      <Form.Select size="md" value={leadForm.lead_source} onChange={(e) => setLeadForm({ ...leadForm, lead_source: e.target.value })}>
                        <option value="walk-in">Walk-in</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="call">Call</option>
                        <option value="referral">Referral</option>
                        <option value="facebook">Facebook</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Address</Form.Label>
                      <Form.Control
                        type="text"
                        value={leadForm.address}
                        onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                        placeholder="Enter address"
                      />
                    </Form.Group>
                  </Col>

                  {/* <Col xs={12} md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Conversion Status</Form.Label>
                      <Form.Select size="sm" value={leadForm.conversion_status} onChange={(e) => setLeadForm({ ...leadForm, conversion_status: e.target.value })}>
                        <option value="not_converted">Not Converted</option>
                        <option value="converted_to_booking">Converted to Booking</option>
                        <option value="lost">Lost</option>
                      </Form.Select>
                    </Form.Group>
                  </Col> */}

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="fw-500">Remarks *</Form.Label>
                      <Form.Control as="textarea" rows={3} value={leadForm.remarks} isInvalid={!!validationErrors.remarks} onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })} placeholder="Short note for follow-up" />
                      <Form.Control.Feedback type="invalid">Remarks required</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                </Row>

                {/* <Form.Check
                    type="switch"
                    id="create-loan-switch"
                    label="Create Loan with this Lead"
                    checked={createLoanWithLead}
                    onChange={(e) => setCreateLoanWithLead(e.target.checked)}
                    className="mt-3"
                /> */}



                {/* Compact chat area for Add Lead (local only)
                <div className="mt-3">
                  <h6 className="fw-500">Chat</h6>
                  <div ref={chatContainerRef} style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #e9ecef', padding: 8, borderRadius: 6 }}>
                    {chatMessages.length ? (
                      chatMessages.map((m) => (
                        <div key={m.id} className="mb-2">
                          <small className="text-muted">{m.author} • {new Date(m.timestamp).toLocaleString()}</small>
                          <div>{m.text}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted small">No messages yet.</div>
                    )}
                  </div>
                  <InputGroup className="mt-2">
                    <Form.Control type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." />
                    <Button variant="primary" onClick={sendChatMessage}>Send</Button>
                  </InputGroup>
                </div> */}

              </Form>


            ) : (
              <Form>
                {/* original full edit form without branch and loan fields */}
                {/* Row 1 */}
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={leadForm.customer_full_name}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, customer_full_name: e.target.value })
                        }
                        placeholder="Enter full name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Contact Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        value={leadForm.contact_number}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, contact_number: e.target.value })
                        }
                        placeholder="+92-300-1234567"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* keep the rest of the edit fields but remove loan & branch fields */}
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="example@email.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">WhatsApp Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={leadForm.whatsapp_number}
                        onChange={(e) => setLeadForm({ ...leadForm, whatsapp_number: e.target.value })}
                        placeholder="WhatsApp number (optional)"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Passport Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={leadForm.passport_number}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, passport_number: e.target.value })
                        }
                        placeholder="AB1234567"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Passport Expiry</Form.Label>
                      <Form.Control
                        type="date"
                        value={leadForm.passport_expiry}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, passport_expiry: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">CNIC Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={leadForm.cnic_number}
                        onChange={(e) => setLeadForm({ ...leadForm, cnic_number: e.target.value })}
                        placeholder="35201-1234567-8"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Address</Form.Label>
                      <Form.Control
                        type="text"
                        value={leadForm.address}
                        onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                        placeholder="Enter address"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Lead Source</Form.Label>
                      <Form.Select
                        value={leadForm.lead_source}
                        onChange={(e) => setLeadForm({ ...leadForm, lead_source: e.target.value })}
                      >
                        <option value="walk-in">Walk-in</option>
                        <option value="call">Call</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="facebook">Facebook</option>
                        <option value="referral">Referral</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Interested In</Form.Label>
                      <Form.Select
                        value={leadForm.interested_in}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, interested_in: e.target.value })
                        }
                      >
                        <option value="ticket">Ticket</option>
                        <option value="umrah">Umrah Package</option>
                        <option value="visa">Visa</option>
                        <option value="transport">Transport</option>
                        <option value="hotel">Hotel</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Next Follow-up Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={leadForm.next_followup_date}
                        isInvalid={!!validationErrors.next_followup_date}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, next_followup_date: e.target.value })
                        }
                      />
                      <Form.Control.Feedback type="invalid">Required</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Next Follow-up Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={leadForm.next_followup_time}
                        isInvalid={!!validationErrors.next_followup_time}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, next_followup_time: e.target.value })
                        }
                      />
                      <Form.Control.Feedback type="invalid">Required</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-500">Last Contacted Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={leadForm.last_contacted_date}
                        onChange={(e) => setLeadForm({ ...leadForm, last_contacted_date: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-500">Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={leadForm.remarks}
                    isInvalid={!!validationErrors.remarks}
                    onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })}
                    placeholder="Add any remarks or notes..."
                  />
                  <Form.Control.Feedback type="invalid">Remarks required</Form.Control.Feedback>
                </Form.Group>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={showEditModal ? handleEditLead : handleAddLead}
            >
              {showEditModal ? "Update Lead" : "Add Lead"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Close Lead Modal */}
        <Modal show={showCloseLeadModal} onHide={() => setShowCloseLeadModal(false)} centered size="md" dialogClassName="compact-modal">
          <Modal.Header closeButton>
              <Modal.Title>{selectedLead && isTaskRecord(selectedLead) ? 'Close Task' : 'Close Lead'}</Modal.Title>
            </Modal.Header>
          <Modal.Body className="compact-modal-body">
            {selectedLead && (
              <div>
                <p className="mb-1"><strong>{selectedLead.customer_full_name}</strong></p>
                <p className="text-muted small">{selectedLead.contact_number} &middot; {selectedLead.email}</p>
              </div>
            )}
            <Form className="mt-2">
              <Form.Group>
                <Form.Label>Action</Form.Label>
                <div>
                  <Form.Check inline type="radio" id="close-lost" name="closeOption" label="Lost" checked={closeLeadOption === 'lost'} onChange={() => setCloseLeadOption('lost')} />
                  <Form.Check inline type="radio" id="close-converted" name="closeOption" label="Converted" checked={closeLeadOption === 'converted'} onChange={() => setCloseLeadOption('converted')} />
                </div>
              </Form.Group>
              <Form.Group className="mt-3">
                <Form.Label>Remarks (required)</Form.Label>
                <Form.Control as="textarea" rows={4} value={closeLeadRemarks} onChange={(e) => setCloseLeadRemarks(e.target.value)} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowCloseLeadModal(false); setCloseLeadRemarks(''); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitCloseLead}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Task Modal */}
        <Modal show={showAddTaskModal} onHide={() => setShowAddTaskModal(false)} centered size="md" dialogClassName="compact-modal">
          <Modal.Header closeButton>
            <Modal.Title>{editingTaskId ? 'Edit Task' : 'Add Task'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            <Form>
              <Row className="g-2">
                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Task Mode</Form.Label>
                    <Form.Select size="sm" value={taskForm.mode} onChange={(e) => setTaskForm({ ...taskForm, mode: e.target.value })}>
                      <option value="customer">Customer Task</option>
                      <option value="internal">Internal Task</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Customer Name {taskForm.mode === 'customer' ? '*' : ''}</Form.Label>
                    <Form.Control type="text" value={taskForm.customer_full_name} onChange={(e) => setTaskForm({ ...taskForm, customer_full_name: e.target.value })} />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Contact Number {taskForm.mode === 'customer' ? '*' : ''}</Form.Label>
                    <Form.Control type="tel" value={taskForm.contact_number} onChange={(e) => setTaskForm({ ...taskForm, contact_number: e.target.value })} />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">WhatsApp Number</Form.Label>
                    <Form.Control type="tel" value={taskForm.whatsapp_number} onChange={(e) => setTaskForm({ ...taskForm, whatsapp_number: e.target.value })} placeholder="WhatsApp number (optional)" />
                  </Form.Group>
                </Col>

                <Col md={12} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-500">Address</Form.Label>
                    <Form.Control type="text" value={taskForm.address} onChange={(e) => setTaskForm({ ...taskForm, address: e.target.value })} placeholder="Enter address" />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label className="fw-500">Follow-up Date</Form.Label>
                    <Form.Control type="date" value={taskForm.next_followup_date} onChange={(e) => setTaskForm({ ...taskForm, next_followup_date: e.target.value })} />
                  </Form.Group>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label className="fw-500">Follow-up Time</Form.Label>
                    <Form.Control type="time" value={taskForm.next_followup_time} onChange={(e) => setTaskForm({ ...taskForm, next_followup_time: e.target.value })} />
                  </Form.Group>
                </Col>

                <Col xs={12} md={12}>
                  <Form.Group>
                    <Form.Label className="fw-500">Task Description *</Form.Label>
                    <Form.Control as="textarea" rows={3} value={taskForm.task_description} onChange={(e) => setTaskForm({ ...taskForm, task_description: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddTaskModal(false); setEditingTaskId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTask}>{editingTaskId ? 'Update Task' : 'Create Task'}</Button>
          </Modal.Footer>
        </Modal>

        {/* View Lead Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="md" dialogClassName="compact-modal" centered>
          <Modal.Header closeButton>
            <Modal.Title>Lead Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            {selectedLead && (
              <div>
                {/* Personal Info */}
                <h6 className="fw-bold mb-3 text-primary">Personal Information</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Full Name</p>
                    <p className="fw-500">{selectedLead.customer_full_name}</p>
                  </Col>
                  {/* <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Passport Number</p>
                    <p className="fw-500">{selectedLead.passport_number}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Passport Expiry</p>
                    <p className="fw-500">{selectedLead.passport_expiry}</p>
                  </Col> */}
                  {/* <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">CNIC Number</p>
                    <p className="fw-500">{selectedLead.cnic_number}</p>
                  </Col> */}
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Contact Number</p>
                    <p className="fw-500">{selectedLead.contact_number}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">WhatsApp Number</p>
                    <p className="fw-500">{selectedLead.whatsapp_number || selectedLead.whatsapp || selectedLead.raw?.whatsapp_number || selectedLead.raw?.whatsapp || '-'}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Email</p>
                    <p className="fw-500">{selectedLead.email}</p>
                  </Col>
                  <Col md={12} className="mb-3">
                    <p className="text-muted small mb-1">Address</p>
                    <p className="fw-500">{selectedLead.address}</p>
                  </Col>
                </Row>

                <div className="d-flex gap-2 mb-3">
                  {/* If this record looks like a loan, surface loan actions here */}
                  { (getLoanAmount(selectedLead) > 0 || getRecoveredAmount(selectedLead) > 0) ? (
                    <>
                      <Button variant="outline-danger" size="sm" onClick={() => openClearLoanModal(selectedLead)}>Clear Loan</Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => openAddBalanceModal(selectedLead)}>Add Balance</Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => openRescheduleLoanModal(selectedLead)}>Reschedule</Button>
                      <Button variant="outline-primary" size="sm" onClick={() => openAddRemarksModal(selectedLead)}>Add Remarks</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline-danger" size="sm" onClick={() => openCloseLeadModal(selectedLead)}>{isTaskRecord(selectedLead) ? 'Close Task' : 'Close Lead'}</Button>
                      <Button variant="outline-primary" size="sm" onClick={() => openAddRemarksModal(selectedLead)}>Add Remarks</Button>
                    </>
                  )}
                  <Button variant="outline-secondary" size="sm" onClick={() => openNextFollowupModal(selectedLead)}>Next Follow Up</Button>
                </div>

                <hr />

                {/* Creation metadata */}
                <Row className="mb-3">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Created By</p>
                    <p className="fw-500">{selectedLead.created_by_username || (selectedLead.created_by_user && (selectedLead.created_by_user.username || selectedLead.created_by_user.name)) || selectedLead.created_by || '-'}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Created At</p>
                    <p className="fw-500">{(() => {
                      const v = selectedLead.created_at || selectedLead.created_on || selectedLead.created;
                      if (!v) return '-';
                      try {
                        const d = (v instanceof Date) ? v : new Date(String(v));
                        if (isNaN(d.getTime())) return String(v);
                        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                        return `${date} ${time}`;
                      } catch (e) { return String(v); }
                    })()}</p>
                  </Col>
                </Row>

                {/* Lead Info
                <h6 className="fw-bold mb-3 text-primary">Lead Information</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Branch</p>
                    <p className="fw-500">{selectedLead.branch_name}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Lead Source</p>
                    <p className="fw-500 text-capitalize">{selectedLead.lead_source}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Lead Status</p>
                    <Badge bg={getStatusBadge(selectedLead.lead_status).bg}>
                      {getStatusBadge(selectedLead.lead_status).label}
                    </Badge>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Interested In</p>
                    <Badge bg="info">{selectedLead.interested_in}</Badge>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Interested Travel Date</p>
                    <p className="fw-500">{selectedLead.interested_travel_date}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Conversion Status</p>
                    <Badge bg={getConversionBadge(selectedLead.conversion_status).bg}>
                      {getConversionBadge(selectedLead.conversion_status).label}
                    </Badge>
                  </Col>
                </Row> */}

                <hr />

                {/* Follow-up Info */}
                <h6 className="fw-bold mb-3 text-primary">Follow-up Information</h6>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Next Follow-up Date</p>
                    <p className="fw-500">{selectedLead.next_followup_date || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Next Follow-up Time</p>
                    <p className="fw-500">{selectedLead.next_followup_time || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted small mb-1">Last Contacted</p>
                    <p className="fw-500">{selectedLead.last_contacted_date}</p>
                  </Col>
                  {(!isTaskRecord(selectedLead) && (selectedLead.loan_promise_date || selectedLead.due_date || getLoanAmount(selectedLead) > 0)) && (
                    <Col md={6} className="mb-3">
                      <p className="text-muted small mb-1">Loan Promise Date</p>
                      <p className="fw-500">{(normalizeDateYMD(selectedLead.loan_promise_date || selectedLead.due_date || selectedLead.raw?.loan_promise_date || selectedLead.raw?.due_date)) || 'N/A'}</p>
                    </Col>
                  )}
                </Row>

                

                {/* Remarks */}
                {selectedLead.remarks && (
                  <>
                    <h6 className="fw-bold mb-3 text-primary">Remarks</h6>
                    <p className="text-muted">{selectedLead.remarks}</p>
                  </>
                )}
                {/* Followups / History */}
                {(selectedLead?.followups && selectedLead.followups.length > 0) && (
                  <>
                    <hr />
                    <h6 className="fw-bold mb-3 text-primary">Follow-up History</h6>
                    <div style={{ maxHeight: 240, overflowY: 'auto', paddingRight: 8 }}>
                      {selectedLead.followups.map((f) => (
                        <div key={f.id || `${f.followup_date}-${Math.random()}`} className="mb-3">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 600 }}>{f.created_by_username || f.created_by || 'Unknown'}</div>
                            <div style={{ fontSize: '0.82rem', color: '#6c757d' }}>{(f.followup_date || f.created_at || f.created_on) ? String(f.followup_date || f.created_at || f.created_on).replace('T', ' ') : ''}</div>
                          </div>
                          {f.remarks && <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }} className="text-muted">{f.remarks}</div>}
                          {f.next_followup_date && (
                            <div style={{ marginTop: 6 }}><small className="text-muted">Next follow-up: {f.next_followup_date}{f.next_followup_time ? ` ${f.next_followup_time}` : ''}</small></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} size="sm" dialogClassName="compact-modal" centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete Lead</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            Are you sure you want to delete lead <strong>{selectedLead?.customer_full_name}</strong>?
            This action cannot be undone.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteLead}>
              Delete Lead
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Remarks Modal */}
        <Modal show={showAddRemarksModal} onHide={() => setShowAddRemarksModal(false)} centered size="md" dialogClassName="compact-modal">
          <Modal.Header closeButton>
            <Modal.Title>Add / Update Remarks</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            {/* Show followup history in the remarks modal as one-sided chat */}
            <div className="followup-history">
              <style dangerouslySetInnerHTML={{ __html: followupStyles }} />
              {(selectedLead?.followups && selectedLead.followups.length > 0) ? (
                selectedLead.followups.map((f) => (
                  <div key={f.id || `${f.followup_date}-${Math.random()}`} className="followup-list-item">
                    <div className="followup-meta">
                      <div>{f.created_by_username || f.created_by || 'Unknown'}</div>
                      <div>{(f.followup_date || f.created_at || f.created_on) ? String(f.followup_date || f.created_at || f.created_on).replace('T', ' ') : ''}</div>
                    </div>
                    <div className="followup-bubble">{f.remarks}</div>
                  </div>
                ))
              ) : (
                <div className="text-muted small">No previous remarks</div>
              )}
            </div>

            <Form className="mt-3">
              <Form.Group>
                <Form.Label>Remarks</Form.Label>
                <Form.Control as="textarea" rows={4} value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddRemarksModal(false); setRemarksInput(''); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddRemarks}>
              Save Remarks
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Next Follow-up Modal */}
        <Modal show={showNextFollowupModal} onHide={() => setShowNextFollowupModal(false)} centered size="md" dialogClassName="compact-modal">
          <Modal.Header closeButton>
            <Modal.Title>Schedule Next Follow-up</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            <Form>
              <Row className="g-2">
                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label>Next Follow-up Date</Form.Label>
                    <Form.Control type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label>Time</Form.Label>
                    <Form.Control type="time" value={followupTime} onChange={(e) => setFollowupTime(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Remarks (required)</Form.Label>
                    <Form.Control as="textarea" rows={3} value={followupRemarks} onChange={(e) => setFollowupRemarks(e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowNextFollowupModal(false); setFollowupDate(''); setFollowupTime(''); setFollowupRemarks(''); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSetNextFollowup}>
              Set Follow-up
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Loan Modal */}
        <Modal show={showAddLoanModal} onHide={() => setShowAddLoanModal(false)} centered size="md" dialogClassName="compact-modal">
          <Modal.Header closeButton>
            <Modal.Title>Add Loan</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            <Form>
              <Row className="g-2">
                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Customer Name *</Form.Label>
                    <Form.Control type="text" value={newLoanForm.customer_full_name} onChange={(e) => setNewLoanForm({ ...newLoanForm, customer_full_name: e.target.value })} />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">WhatsApp Number</Form.Label>
                    <Form.Control type="tel" value={newLoanForm.whatsapp_number} onChange={(e) => setNewLoanForm({ ...newLoanForm, whatsapp_number: e.target.value })} placeholder="WhatsApp number (optional)" />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Customer Number</Form.Label>
                    <Form.Control type="tel" value={newLoanForm.contact_number} onChange={(e) => setNewLoanForm({ ...newLoanForm, contact_number: e.target.value })} placeholder="Contact number (required for some records)" />
                  </Form.Group>
                </Col>

                <Col xs={12} md={12}>
                  <Form.Group>
                    <Form.Label className="fw-500">Address</Form.Label>
                    <Form.Control type="text" value={newLoanForm.address || ''} onChange={(e) => setNewLoanForm({ ...newLoanForm, address: e.target.value })} placeholder="Address (optional)" />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Email</Form.Label>
                    <Form.Control type="email" value={newLoanForm.email} onChange={(e) => setNewLoanForm({ ...newLoanForm, email: e.target.value })} />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Loan Amount *</Form.Label>
                    <Form.Control
                      type="number"
                      value={newLoanForm.amount}
                      isInvalid={!!newLoanValidationErrors.amount}
                      onChange={(e) => setNewLoanForm({ ...newLoanForm, amount: e.target.value })}
                      placeholder="Amount"
                    />
                    <Form.Control.Feedback type="invalid">Loan amount is required</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-500">Loan Promise Date</Form.Label>
                    <Form.Control type="date" value={newLoanForm.loan_promise_date} onChange={(e) => setNewLoanForm({ ...newLoanForm, loan_promise_date: e.target.value })} />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-500">Loan Reason</Form.Label>
                    <Form.Control as="textarea" rows={3} value={newLoanForm.reason} onChange={(e) => setNewLoanForm({ ...newLoanForm, reason: e.target.value })} placeholder="Reason for loan, any notes..." />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddLoanModal(false); setChatMessages([]); setChatInput(""); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddLoan}>
              Add Loan
            </Button>
          </Modal.Footer>

        </Modal>
        {/* Clear Loan Modal */}
        <Modal show={showClearLoanModal} onHide={() => setShowClearLoanModal(false)} centered size="sm" dialogClassName="compact-modal">
          <Modal.Header closeButton>
            <Modal.Title>Clear Loan</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            <p className="mb-2">Loan: <strong>{selectedLoanForAction?.customer_full_name}</strong></p>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Recovered Amount</Form.Label>
                <Form.Control type="number" value={loanActionAmount} onChange={(e) => setLoanActionAmount(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Remarks (optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={loanActionRemarks} onChange={(e) => setLoanActionRemarks(e.target.value)} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowClearLoanModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitClearLoan}>Clear Loan</Button>
          </Modal.Footer>
        </Modal>

        {/* Reschedule Loan Modal */}
        <Modal show={showRescheduleLoanModal} onHide={() => setShowRescheduleLoanModal(false)} centered size="sm" dialogClassName="compact-modal">
          <Modal.Header closeButton>
            <Modal.Title>Reschedule Loan</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            <p className="mb-2">Loan: <strong>{selectedLoanForAction?.customer_full_name}</strong></p>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>New Promise Date</Form.Label>
                <Form.Control type="date" value={loanActionDate} onChange={(e) => setLoanActionDate(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Remarks (optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={loanActionRemarks} onChange={(e) => setLoanActionRemarks(e.target.value)} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRescheduleLoanModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitRescheduleLoan}>Reschedule</Button>
          </Modal.Footer>
        </Modal>

        {/* Add Balance Modal */}
        <Modal show={showAddBalanceModal} onHide={() => setShowAddBalanceModal(false)} centered size="sm" dialogClassName="compact-modal">
          <Modal.Header closeButton>
            <Modal.Title>Add Recovered Amount</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-modal-body">
            <p className="mb-2">Loan: <strong>{selectedLoanForAction?.customer_full_name}</strong></p>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Amount Collected</Form.Label>
                <Form.Control type="number" value={loanActionAmount} onChange={(e) => setLoanActionAmount(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Remarks (optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={loanActionRemarks} onChange={(e) => setLoanActionRemarks(e.target.value)} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddBalanceModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitAddBalance}>Submit</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default LeadManagement;