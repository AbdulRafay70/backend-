import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Badge } from "react-bootstrap";
import { Plus, ArrowClockwise, PencilSquare, Trash } from 'react-bootstrap-icons';
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import PartnersTabs from "../../components/PartnersTabs";
import AdminFooter from "../../components/AdminFooter";
import axios from "axios";
import { Link } from "react-router-dom";

const Discounts = () => {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState("");

  // read organization and token from localStorage
  const orgDataRaw = localStorage.getItem("selectedOrganization");
  let organizationId = 0;
  try {
    const parsed = orgDataRaw ? JSON.parse(orgDataRaw) : null;
    organizationId = parsed?.id ?? 0;
  } catch (e) {
    organizationId = 0;
  }
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/discount-groups/", {
        params: organizationId ? { organization: organizationId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // backend may return array or { results: [...] }
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
      // Ensure groups are scoped to the logged-in user's organization. Backend should support filtering,
      // but also apply a client-side fallback in case the API doesn't filter.
      const scoped = organizationId ? data.filter((g) => {
        const org = g.organization;
        if (org == null) return false;
        if (typeof org === 'number') return org === organizationId;
        if (typeof org === 'object') return (org.id === organizationId) || (org === organizationId);
        return false;
      }) : data;
      setGroups(scoped);
    } catch (e) {
      console.error("Failed to fetch discount-groups", e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setName("");
    setGroupType("");
    setShowModal(true);
  };

  const openEdit = (group) => {
    setEditing(group);
    setName(group.name || "");
    setGroupType(group.group_type || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const submit = async () => {
    const payload = {
      name: name,
      group_type: groupType || null,
      organization: organizationId || 0,
      is_active: true,
    };

    try {
      if (editing && editing.id) {
        await axios.patch(`http://127.0.0.1:8000/api/discount-groups/${editing.id}/`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      } else {
        await axios.post("http://127.0.0.1:8000/api/discount-groups/", payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      }
      closeModal();
      fetchGroups();
    } catch (e) {
      console.error("Failed to save discount group", e);
      alert("Failed to save discount group");
    }
  };

  const removeGroup = async (id) => {
    if (!confirm("Delete this discount group?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/discount-groups/${id}/`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      fetchGroups();
    } catch (e) {
      console.error("Failed to delete discount group", e);
      alert("Failed to delete");
    }
  };

  // client-side filtered groups based on searchTerm
  const filteredGroups = groups.filter((g) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const name = (g.name || "").toString().toLowerCase();
    const type = (g.group_type || "").toString().toLowerCase();
    return name.includes(s) || type.includes(s);
  });

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2"><Sidebar /></div>
        <div className="col-12 col-lg-10">
          <div className="container">
            <Header />
            <div className="px-3 px-lg-4 my-3">
              <PartnersTabs />

              <div className="p-3 bg-white rounded shadow-sm" style={{ border: '1px solid rgba(23,23,23,0.04)' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <h5 className="mb-0">Discount Groups</h5>
                    <Badge bg="secondary" pill style={{ fontSize: '0.8rem' }}>{/* filtered / total */}{/* placeholder replaced below */}</Badge>
                    <span className="small text-muted">&nbsp;</span>
                  </div>

                  <div className="d-flex gap-2 w-100 w-md-auto">
                    <div className="input-group" style={{ minWidth: 220 }}>
                      <input className="form-control form-control-sm" placeholder="Search groups by name or type" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      <button className="btn btn-outline-secondary btn-sm" type="button" onClick={fetchGroups}><ArrowClockwise /></button>
                    </div>
                    {/* <Button size="sm" variant="outline-secondary" onClick={fetchGroups}><ArrowClockwise className="me-1" /></Button> */}
                    <Button size="sm" variant="primary" onClick={openAdd}><Plus className="me-1" /> Add Group</Button>
                    <Link to="/partners/discounts/update-discountss" className="btn btn-outline-secondary btn-sm">Assign Permissions</Link>
                  </div>
                </div>

                <Table responsive className="table-borderless align-middle table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
                    ) : filteredGroups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-5">
                          <div>
                            <div style={{ fontSize: 36, opacity: 0.6 }}>🔍</div>
                            <div className="mt-2">{groups.length === 0 ? 'No discount groups found' : 'No matching discount groups'}</div>
                            {groups.length === 0 ? (
                              <div className="mt-3">
                                <Button variant="primary" size="sm" onClick={openAdd}><Plus className="me-1" /> Create first group</Button>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm("")}>Clear search</Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredGroups.map((g) => (
                        <tr key={g.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{g.name}</div>
                            <div style={{ fontSize: 12, color: '#6c757d' }}>{g.description || ''}</div>
                          </td>
                          <td>{g.group_type ? <Badge bg="info">{g.group_type}</Badge> : <span className="text-muted">-</span>}</td>
                          <td>{g.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button title="Edit" size="sm" variant="outline-primary" onClick={() => openEdit(g)}><PencilSquare /></Button>
                              <Button title="Delete" size="sm" variant="outline-danger" onClick={() => removeGroup(g.id)}><Trash /></Button>
                              <Button title="Copy JSON" size="sm" variant="outline-secondary" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(g, null, 2)); alert('Copied'); }}>Copy</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              <AdminFooter />
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-semibold">{editing ? "Edit" : "Add"} Discount Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">Group Name</Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Sale 2025" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">Group Type</Form.Label>
              <Form.Control value={groupType} onChange={(e) => setGroupType(e.target.value)} placeholder="seasonal / campaign" />
              <Form.Text className="text-muted">Optional. Used for grouping and filters.</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{editing ? "Save changes" : "Create group"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Discounts;
//                           </Dropdown.Item>
//                           <Dropdown.Item className="text-danger">
//                             Remove
//                           </Dropdown.Item>
//                           <Dropdown.Item>Cancel</Dropdown.Item>
//                         </Dropdown.Menu>
//                       </Dropdown>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//             <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 mb-3">
//               <div className="d-flex flex-wrap align-items-center">
//                 <span className="me-2">Showing</span>
//                 <select
//                   className="form-select form-select-sm me-2"
//                   style={{ width: "auto" }}
//                 >
//                   <option>8</option>
//                 </select>
//                 <span className="me-2">out of 286</span>
//               </div>
//               <nav>
//                 <ul className="pagination pagination-sm mb-0">
//                   <li className="page-item">
//                     <a className="page-link" href="#">
//                       Previous
//                     </a>
//                   </li>
//                   <li className="page-item active">
//                     <a className="page-link" href="#">
//                       1
//                     </a>
//                   </li>
//                   <li className="page-item">
//                     <a className="page-link" href="#">
//                       2
//                     </a>
//                   </li>
//                   <li className="page-item">
//                     <a className="page-link" href="#">
//                       3
//                     </a>
//                   </li>
//                   <li className="page-item disabled">
//                     <span className="page-link">...</span>
//                   </li>
//                   <li className="page-item">
//                     <a className="page-link" href="#">
//                       18
//                     </a>
//                   </li>
//                   <li className="page-item">
//                     <a className="page-link" href="#">
//                       Next
//                     </a>
//                   </li>
//                 </ul>
//               </nav>
//             </div>
//           </div>
//             <AdminFooter />
//         </div>
//         </div>
//         </div>
//       </div>

//       {/* Modal Add user */}
//       <Modal
//         show={showModal}
//         onHide={handleClose}
//         centered
//         style={{ fontFamily: "Poppins, sans-serif" }}
//       >
//         <Modal.Body className="">
//           <h4 className="text-center fw-bold p-4 mb-4">Add Discout group</h4>
//           <hr />
//           <Form className="p-4">
//             <div className="mb-3">
//               <fieldset
//                 className="border border-black p-2 rounded mb-3"
//                 style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
//               >
//                 <legend
//                   className="float-none w-auto px-1 fs-6"
//                   style={{
//                     marginBottom: "0.25rem",
//                     fontSize: "0.9rem",
//                     lineHeight: "-1",
//                   }}
//                 >
//                   Group Name
//                 </legend>
//                 <input
//                   type="text"
//                   name="phoneNo"
//                   className="form-control rounded shadow-none border-0 px-1 py-2"
//                   required
//                   placeholder="Agent Permi"
//                   value={partnerForm.phoneNo}
//                   onChange={handlePartnerChange}
//                 />
//               </fieldset>
//             </div>
//             <div className="mb-3">
//               <fieldset
//                 className="border border-black  p-2 rounded mb-3"
//                 style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
//               >
//                 <legend
//                   className="float-none w-auto px-1 fs-6"
//                   style={{
//                     marginBottom: "0.25rem",
//                     fontSize: "0.9rem",
//                     lineHeight: "-1",
//                   }}
//                 >
//                   Group Type
//                 </legend>
//                 <input
//                   type="text"
//                   name="name"
//                   className="form-control rounded shadow-none border-0 px-1 py-2"
//                   required
//                   placeholder="Write Type"
//                   value={partnerForm.name}
//                   onChange={handlePartnerChange}
//                 />
//               </fieldset>
//             </div>

//             <div className="d-flex justify-content-between">
//               <Button variant="primary" onClick={handlePartnerSubmit}>
//                 Save and close
//               </Button>
//               <Button variant="primary" onClick={handlePartnerSubmit}>
//                 Save
//               </Button>
//               <Button
//                 variant="light"
//                 className="text-muted"
//                 onClick={handleClose}
//               >
//                 Cancel
//               </Button>
//             </div>
//           </Form>
//         </Modal.Body>
//       </Modal>
//     </div>
//   );
// };

// export default Discounts;
