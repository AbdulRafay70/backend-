import React from "react";

const HotelRowSkeleton = () => {
  return (
    <tr>
      <td>
        <div className="skeleton-text" style={{ width: "100px", height: "20px" }}></div>
        <div className="skeleton-text" style={{ width: "50px", height: "15px", marginTop: "5px" }}></div>
      </td>
      <td><div className="skeleton-text" style={{ width: "80px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "150px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "100px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "120px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "60px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "60px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "60px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "60px", height: "20px" }}></div></td>
      <td><div className="skeleton-text" style={{ width: "30px", height: "30px" }}></div></td>
    </tr>
  );
};

export default HotelRowSkeleton;