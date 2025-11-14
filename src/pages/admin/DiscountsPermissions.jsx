import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import { Search } from "react-bootstrap-icons";
import AdminFooter from "../../components/AdminFooter";

const UpdateGroupPermissions = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        groupName: "Select Group",
        groupTickets: "",
        umrahPackageDiscount: "",
        jedMakMedDiscount1: "",
        jedMakMedDiscount2: "",
        rushdAlMajdDiscount: "",
        saifAlMajdDiscount: "",
        fawadNasaDiscount: "",
        umrahVisaDiscount: "",
    });

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const tabs = [
        { name: "All Partners", path: "/partners" },
        { name: "Request", path: "/partners/request" },
        { name: "Group And Permissions", path: "/partners/role-permissions" },
        { name: "Discounts", path: "/partners/discounts" },
        { name: "Organizations", path: "/partners/organization" },
        { name: "Branches", path: "/partners/branche" },
        { name: "Agencies", path: "/partners/agencies" },
    ];

    return (
        <div
            className="container-fluid"
            style={{ fontFamily: "Poppins, sans-serif" }}
        >
            <div className="row">
                <div className="col-lg-2 mb-3">
                    <Sidebar />
                </div>
                <div className="col-lg-10">
                    <div className="container">
                        <Header />

                        <div className="row my-3 w-100">
                            <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                                <nav className="nav flex-wrap gap-2">
                                    {tabs.map((tab, index) => (
                                        <NavLink
                                            key={index}
                                            to={tab.path}
                                            className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Discounts"
                                                ? "text-primary fw-semibold"
                                                : "text-muted"
                                                }`}
                                            style={{ backgroundColor: "transparent" }}
                                        >
                                            {tab.name}
                                        </NavLink>
                                    ))}
                                </nav>

                                <div className="input-group" style={{ maxWidth: "300px" }}>
                                    <span className="input-group-text">
                                        <Search />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search name, address, job, etc"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 border rounded-4">
                            <div className="">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-semibold">Update Group Permissions</h5>
                                    <div className="d-flex flex-wrap gap-2">
                                        <button className="btn btn-primary">Update</button>
                                        <button className="btn btn-primary">Groups</button>
                                        <button className="btn btn-primary">Print</button>
                                        <button className="btn btn-primary">Download</button>
                                    </div>
                                </div>
                            </div>

                            <div className="row mt-3">
                                {/* Group Name Selection */}
                                <div className="mb-4 col-md-4">
                                    <fieldset
                                        className="border border-black p-2 rounded mb-3"
                                        style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                                    >
                                        <legend
                                            className="float-none w-auto px-1 fs-6"
                                            style={{
                                                marginBottom: "0.25rem",
                                                fontSize: "0.9rem",
                                                lineHeight: "1",
                                            }}
                                        >
                                            Group Name
                                        </legend>
                                        <select
                                            className="border-0 w-100 bg-transparent"
                                            value={formData.groupName}
                                            onChange={(e) =>
                                                handleInputChange("groupName", e.target.value)
                                            }
                                        >
                                            <option>Select Group</option>
                                            <option>Group 1</option>
                                            <option>Group 2</option>
                                            <option>Group 3</option>
                                        </select>
                                    </fieldset>
                                </div>

                                {/* Tickets Section */}
                                <div className="mb-4">
                                    <h6 className="text-muted mb-3 fw-semibold">Tickets</h6>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    Group Tickets
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="Write Discount"
                                                    value={formData.groupTickets}
                                                    onChange={(e) =>
                                                        handleInputChange("groupTickets", e.target.value)
                                                    }
                                                />
                                            </fieldset>
                                        </div>
                                    </div>
                                </div>

                                {/* Discount On Full Umrah Package */}
                                <div className="mb-4">
                                    <h6 className="text-muted mb-3 fw-semibold">
                                        Discount On Full Umrah Package
                                    </h6>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    Umrah Package
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="Write Discount"
                                                    value={formData.umrahPackageDiscount}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "umrahPackageDiscount",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </fieldset>
                                        </div>
                                    </div>
                                </div>

                                {/* Transport Section */}
                                <div className="mb-4">
                                    <h6 className="text-muted mb-3 fw-semibold">Transport</h6>
                                    <div className="row mb-3">
                                        <div className="col-md-2">
                                            <span className="text-muted">JED-mak-MED</span>
                                        </div>
                                        <div className="col-md-4">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    Discount On this Sector
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="lsr"
                                                    value={formData.jedMakMedDiscount1}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "jedMakMedDiscount1",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </fieldset>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-2">
                                            <span className="text-muted">JED-mak-MED</span>
                                        </div>
                                        <div className="col-md-4">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    Discount On this Sector
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="lsr"
                                                    value={formData.jedMakMedDiscount2}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "jedMakMedDiscount2",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </fieldset>
                                        </div>
                                    </div>
                                </div>

                                {/* Hotel Nights Section */}
                                <div className="mb-4">
                                    <h6 className="text-muted mb-3 fw-semibold">Hotel Nights</h6>

                                    <div className="row mb-3">
                                        <div className="col-md-2">
                                            <span className="text-muted">Rushd Al majd</span>
                                        </div>
                                        <div className="col-md-4">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    per Night Discount
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="lsr"
                                                    value={formData.rushdAlMajdDiscount}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "rushdAlMajdDiscount",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </fieldset>
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-2">
                                            <span className="text-muted">Saif Al majd</span>
                                        </div>
                                        <div className="col-md-4">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    per Night Discount
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="2sr"
                                                    value={formData.saifAlMajdDiscount}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "saifAlMajdDiscount",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </fieldset>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-2">
                                            <span className="text-muted">Fawad Nasa</span>
                                        </div>
                                        <div className="col-md-4">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    per Night Discount
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="2sr"
                                                    value={formData.fawadNasaDiscount}
                                                    onChange={(e) =>
                                                        handleInputChange("fawadNasaDiscount", e.target.value)
                                                    }
                                                />
                                            </fieldset>
                                        </div>
                                    </div>
                                </div>

                                {/* Visa Section */}
                                <div className="mb-4">
                                    <h6 className="text-muted mb-3 fw-semibold">Visa</h6>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <fieldset className="border border-black p-2 rounded mb-3">
                                                <legend className="float-none w-auto px-1 fs-6">
                                                    Umrah Visa
                                                </legend>
                                                <input
                                                    type="text"
                                                    className="form-control rounded shadow-none border-0 px-1 py-0"
                                                    placeholder="Write Discount"
                                                    value={formData.umrahVisaDiscount}
                                                    onChange={(e) =>
                                                        handleInputChange("umrahVisaDiscount", e.target.value)
                                                    }
                                                />
                                            </fieldset>
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
    );
};

export default UpdateGroupPermissions;
