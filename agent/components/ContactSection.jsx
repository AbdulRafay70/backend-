import { DicesIcon, Instagram, Twitter } from "lucide-react";
import React, { useState } from "react";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    alert("Message sent successfully!");
  };

  return (
    <div
      className="container py-5"
      style={{ fontFamily: "poppins, sans-serif" }}
    >
      <div
        className="text-center mb-5"
        style={{ fontFamily: "Nunito Sans, sans-serif" }}
      >
        <h2 className="mb-3" style={{ fontSize: "2.5rem", fontWeight: "900" }}>
          Contact Us
        </h2>
        <p className="text-muted">
          Any question or remarks? Just write us a message!
        </p>
      </div>

      <div
        className="row g-0 shadow-lg rounded-4 overflow-hidden"
        style={{ minHeight: "600px", border:"10px solid white" }}
      >
        {/* Left Side - Contact Information */}
        <div className="col-lg-5">
          <div
            className="h-100 p-5 text-white position-relative"
            style={{
              background: "#1B78CE",
              borderRadius: "1.5rem 0 0 1.5rem",
            }}
          >
            {/* Decorative circles */}
            <div
              className="position-absolute rounded-circle"
              style={{
                width: "150px",
                height: "150px",
                background: "rgba(255,255,255,0.1)",
                bottom: "20px",
                right: "-20px",
              }}
            ></div>
            <div
              className="position-absolute rounded-circle"
              style={{
                width: "100px",
                height: "100px",
                background: "rgba(255,255,255,0.1)",
                bottom: "100px",
                right: "50px",
              }}
            ></div>

            <div className="position-relative" style={{ zIndex: 1 }}>
              <h3 className="fw-bold mb-3">Contact Information</h3>
              <p className="mb-5" style={{ opacity: 0.75 }}>
                Say something to start a live chat!
              </p>

              <div className="mb-4">
                <div className="d-flex align-items-center mb-4">
                  <i className="fas fa-phone me-3 fs-5"></i>
                  <span>+1012 3456 789</span>
                </div>

                <div className="d-flex align-items-center mb-4">
                  <i className="fas fa-envelope me-3 fs-5"></i>
                  <span>demo@gmail.com</span>
                </div>

                <div className="d-flex align-items-start">
                  <i className="fas fa-map-marker-alt me-3 fs-5 mt-1"></i>
                  <span>
                    132 Dartmouth Street Boston,
                    <br />
                    Massachusetts 02156 United States
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div className="d-flex gap-3">
                  <a href="#" className="text-white text-decoration-none">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "rgba(255,255,255,0.2)",
                      }}
                    >
                      <Twitter />
                    </div>
                  </a>
                  <a href="#" className="text-white text-decoration-none">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "rgba(255,255,255,0.2)",
                      }}
                    >
                      <Instagram />
                    </div>
                  </a>
                  <a href="#" className="text-white text-decoration-none">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "rgba(255,255,255,0.2)",
                      }}
                    >
                      <DicesIcon />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="col-lg-7">
          <div className="p-5">
            <div>
              <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0">
                  <input
                    type="text"
                    className="form-control border-0 border-bottom rounded-0 px-0 py-3"
                    placeholder="Enter First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    style={{ boxShadow: "none" }}
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control border-0 border-bottom rounded-0 px-0 py-3"
                    placeholder="Enter Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    style={{ boxShadow: "none" }}
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0">
                  <input
                    type="email"
                    className="form-control border-0 border-bottom rounded-0 px-0 py-3"
                    placeholder="Enter Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ boxShadow: "none" }}
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="tel"
                    className="form-control border-0 border-bottom rounded-0 px-0 py-3"
                    placeholder="Enter Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{ boxShadow: "none" }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-dark mb-3">
                  Select Subject?
                </label>
                <div className="d-flex flex-wrap gap-3">
                  {["General Inquiry", "Support", "Sales", "Partnership"].map(
                    (option, index) => (
                      <div key={index} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="subject"
                          value={option}
                          id={`subject${index}`}
                          checked={formData.subject === option}
                          onChange={handleInputChange}
                        />
                        <label
                          className="form-check-label text-muted"
                          htmlFor={`subject${index}`}
                        >
                          {option}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-dark mb-2">Message</label>
                <textarea
                  className="form-control border-0 border-bottom rounded-0 px-0 py-3"
                  rows="4"
                  placeholder="Write your message.."
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  style={{ boxShadow: "none", resize: "none" }}
                ></textarea>
              </div>

              <div className="text-end">
                <button
                  type="button"
                  className="btn btn-primary px-5 py-3 rounded-pill fw-semibold"
                  onClick={handleSubmit}
                  style={{
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    border: "none",
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
