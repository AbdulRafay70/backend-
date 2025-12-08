import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { NavLink } from "react-router-dom";
import Select from "react-select";
import { Search } from "react-bootstrap-icons";
import PartnersTabs from "../../components/PartnersTabs";
import AdminFooter from "../../components/AdminFooter";
import axios from "axios";

const UpdateGroupPermissions = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [hotelsList, setHotelsList] = useState([]); // options for select

    const [formData, setFormData] = useState({
        group_type: "",
        discounts: {
            group_ticket_discount_amount: "",
            umrah_package_discount_amount: "",
        },
        hotel_night_discounts: [
            {
                quint_per_night_discount: "",
                quad_per_night_discount: "",
                triple_per_night_discount: "",
                double_per_night_discount: "",
                sharing_per_night_discount: "",
                other_per_night_discount: "",
                discounted_hotels: [],
            },
        ],
    });
    // hotelsInput removed; discounted_hotels are edited on each hotel_night_discounts entry
    const token = localStorage.getItem("accessToken");
    // parse selected organization id from localStorage
    const orgDataRaw = localStorage.getItem("selectedOrganization");
    let organizationId = null;
    try {
        const parsed = orgDataRaw ? JSON.parse(orgDataRaw) : null;
        organizationId = parsed?.id ?? null;
    } catch (e) {
        organizationId = null;
    }

    useEffect(() => {
        fetchGroups();
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            // request hotels filtered by organization
            const res = await axios.get("http://127.0.0.1:8000/api/hotels/", {
                params: organizationId ? { organization: organizationId } : {},
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
            // transform into react-select options
            const options = data.map((h) => ({ value: h.id, label: h.name || h.title || `Hotel ${h.id}` }));
            setHotelsList(options);
        } catch (e) {
            console.error("Failed to load hotels", e);
            setHotelsList([]);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:8000/api/discount-groups/", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
            setGroups(data);
        } catch (e) {
            console.error("Failed to load groups", e);
            setGroups([]);
        }
    };

    const loadGroupDetails = async (groupId) => {
        if (!groupId) return;
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/discount-groups/${groupId}/`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const data = res.data || {};
            // If the backend already stores these properties, prefill them. Otherwise leave defaults.
            setFormData((prev) => ({
                ...prev,
                group_type: data.group_type ?? prev.group_type,
                discounts: {
                    group_ticket_discount_amount: data.discounts?.group_ticket_discount_amount ?? prev.discounts.group_ticket_discount_amount,
                    umrah_package_discount_amount: data.discounts?.umrah_package_discount_amount ?? prev.discounts.umrah_package_discount_amount,
                },
                hotel_night_discounts: data.hotel_night_discounts && data.hotel_night_discounts.length > 0 ? data.hotel_night_discounts : prev.hotel_night_discounts,
            }));
            // hotel_night_discounts are set above; discounted_hotels are part of those entries
        } catch (e) {
            console.error("Failed to load group details", e);
        }
    };

    

    
        return (
        <div
            className="container-fluid"
            style={{ fontFamily: "Poppins, sans-serif" }}
        >
            <div className="row g-0">
                <div className="col-12 col-lg-2 mb-3">
                    <Sidebar />
                </div>
                <div className="col-12 col-lg-10">
                    <div className="container">
                        <Header />
                        <div className="px-3 px-lg-4 my-3">
                            <PartnersTabs />
                            <div className="row my-3 w-100">
                                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                                    <div />
                                    <div className="input-group" style={{ maxWidth: "300px" }}>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border rounded-4">
                                <div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 fw-semibold">Update Group Permissions</h5>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2 mt-3">
                                        <button className="btn btn-secondary" onClick={() => { setFormData({ group_type: "", discounts: { group_ticket_discount_amount: "", umrah_package_discount_amount: "" }, hotel_night_discounts: [{ quint_per_night_discount: "", quad_per_night_discount: "", triple_per_night_discount: "", double_per_night_discount: "", sharing_per_night_discount: "", other_per_night_discount: "", discounted_hotels: [] }] }); }}>Reset</button>
                                        <button className="btn btn-primary" onClick={async () => {
                                            if (!selectedGroupId) return alert('Select a discount group first');
                                            const hd = formData.hotel_night_discounts.map((item) => ({ ...item }));
                                            const payload = {
                                                group_type: formData.group_type,
                                                discounts: formData.discounts,
                                                hotel_night_discounts: hd,
                                            };
                                            try {
                                                await axios.patch(`http://127.0.0.1:8000/api/discount-groups/${selectedGroupId}/`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                                                alert('Updated successfully');
                                                fetchGroups();
                                            } catch (e) {
                                                console.error('Failed to update group', e);
                                                alert('Failed to update group');
                                            }
                                        }}>Save</button>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="mb-4 col-md-6">
                                            <label className="form-label fw-semibold">Select Discount Group</label>
                                            <select className="form-select" value={selectedGroupId || ""} onChange={(e) => { const id = e.target.value || null; setSelectedGroupId(id); if (id) loadGroupDetails(id); }}>
                                                <option value="">Select Group</option>
                                                {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                                            </select>
                                        </div>

                                        <div className="mb-4">
                                            <h6 className="text-muted mb-3 fw-semibold">Discounts</h6>
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label">Group Ticket Discount Amount</label>
                                                    <input type="text" className="form-control" value={formData.discounts.group_ticket_discount_amount} onChange={(e) => setFormData((p) => ({ ...p, discounts: { ...p.discounts, group_ticket_discount_amount: e.target.value } }))} placeholder="e.g. 922" />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Umrah Package Discount Amount</label>
                                                    <input type="text" className="form-control" value={formData.discounts.umrah_package_discount_amount} onChange={(e) => setFormData((p) => ({ ...p, discounts: { ...p.discounts, umrah_package_discount_amount: e.target.value } }))} placeholder="e.g. 150" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h6 className="text-muted mb-3 fw-semibold">Hotel Night Discounts</h6>
                                            {formData.hotel_night_discounts.map((hn, idx) => (
                                                <div key={idx} className="card mb-3 p-3">
                                                    <div className="row g-3">
                                                        <div className="col-md-4">
                                                            <label className="form-label">Quint Per Night Discount</label>
                                                            <input className="form-control" value={hn.quint_per_night_discount || ""} onChange={(e) => { const v = e.target.value; setFormData((p) => { const copy = { ...p }; copy.hotel_night_discounts = copy.hotel_night_discounts.map((item, i) => i === idx ? { ...item, quint_per_night_discount: v } : item); return copy; }); }} />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label">Quad Per Night Discount</label>
                                                            <input className="form-control" value={hn.quad_per_night_discount || ""} onChange={(e) => { const v = e.target.value; setFormData((p) => { const copy = { ...p }; copy.hotel_night_discounts = copy.hotel_night_discounts.map((item, i) => i === idx ? { ...item, quad_per_night_discount: v } : item); return copy; }); }} />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label">Triple Per Night Discount</label>
                                                            <input className="form-control" value={hn.triple_per_night_discount || ""} onChange={(e) => { const v = e.target.value; setFormData((p) => { const copy = { ...p }; copy.hotel_night_discounts = copy.hotel_night_discounts.map((item, i) => i === idx ? { ...item, triple_per_night_discount: v } : item); return copy; }); }} />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label">Double Per Night Discount</label>
                                                            <input className="form-control" value={hn.double_per_night_discount || ""} onChange={(e) => { const v = e.target.value; setFormData((p) => { const copy = { ...p }; copy.hotel_night_discounts = copy.hotel_night_discounts.map((item, i) => i === idx ? { ...item, double_per_night_discount: v } : item); return copy; }); }} />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label">Sharing Per Night Discount</label>
                                                            <input className="form-control" value={hn.sharing_per_night_discount || ""} onChange={(e) => { const v = e.target.value; setFormData((p) => { const copy = { ...p }; copy.hotel_night_discounts = copy.hotel_night_discounts.map((item, i) => i === idx ? { ...item, sharing_per_night_discount: v } : item); return copy; }); }} />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label">Other Per Night Discount</label>
                                                            <input className="form-control" value={hn.other_per_night_discount || ""} onChange={(e) => { const v = e.target.value; setFormData((p) => { const copy = { ...p }; copy.hotel_night_discounts = copy.hotel_night_discounts.map((item, i) => i === idx ? { ...item, other_per_night_discount: v } : item); return copy; }); }} />
                                                        </div>
                                                        <div className="col-md-8">
                                                            <label className="form-label">Discounted Hotels</label>
                                                            <Select isMulti options={hotelsList} value={hotelsList.filter(opt => (hn.discounted_hotels || []).includes(opt.value))} onChange={(selectedOptions) => { const ids = Array.isArray(selectedOptions) ? selectedOptions.map(o => o.value) : []; setFormData((p) => { const copy = { ...p }; copy.hotel_night_discounts = copy.hotel_night_discounts.map((item, i) => i === idx ? { ...item, discounted_hotels: ids } : item); return copy; }); }} placeholder="Select hotels..." closeMenuOnSelect={false} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="d-flex gap-2">
                                                <button type="button" className="btn btn-outline-primary" onClick={() => setFormData((p) => ({ ...p, hotel_night_discounts: [...p.hotel_night_discounts, { quint_per_night_discount: "", quad_per_night_discount: "", triple_per_night_discount: "", double_per_night_discount: "", sharing_per_night_discount: "", other_per_night_discount: "", discounted_hotels: [] }] }))}>Add Night Discount</button>
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setFormData((p) => ({ ...p, hotel_night_discounts: p.hotel_night_discounts.slice(0, -1) }))}>Remove Last</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <AdminFooter />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateGroupPermissions;
