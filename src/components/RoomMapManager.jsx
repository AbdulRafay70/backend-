import React, { useState } from "react";
import { Card, Form, Button, Row, Col, Badge, Modal, Spinner, Alert, Tab, Tabs, Table } from "react-bootstrap";
import { Plus, Edit2, Trash2, Upload, Grid3x3, Home, Bed, AlertCircle, CheckCircle, X } from "lucide-react";
import axios from "axios";

const RoomMapManager = ({ hotelId, onSaved }) => {
  const [activeTab, setActiveTab] = useState("floors");
  
  // Demo hardcoded data
  const demoFloors = [
    {
      floor_no: 1,
      floor_map_url: "https://via.placeholder.com/400x300?text=Floor+1+Layout",
      rooms: [
        {
          id: 1,
          room_no: "101",
          room_type: "double",
          capacity: 2,
          status: "available",
          beds: [
            { id: 1, bed_no: "1A", status: "available" },
            { id: 2, bed_no: "1B", status: "available" }
          ]
        },
        {
          id: 2,
          room_no: "102",
          room_type: "quad",
          capacity: 4,
          status: "occupied",
          beds: [
            { id: 3, bed_no: "1", status: "occupied" },
            { id: 4, bed_no: "2", status: "occupied" },
            { id: 5, bed_no: "3", status: "available" },
            { id: 6, bed_no: "4", status: "available" }
          ]
        },
        {
          id: 3,
          room_no: "103",
          room_type: "triple",
          capacity: 3,
          status: "available",
          beds: [
            { id: 7, bed_no: "A", status: "available" },
            { id: 8, bed_no: "B", status: "available" },
            { id: 9, bed_no: "C", status: "maintenance" }
          ]
        }
      ]
    },
    {
      floor_no: 2,
      floor_map_url: "https://via.placeholder.com/400x300?text=Floor+2+Layout",
      rooms: [
        {
          id: 4,
          room_no: "201",
          room_type: "double",
          capacity: 2,
          status: "available",
          beds: [
            { id: 10, bed_no: "1", status: "available" },
            { id: 11, bed_no: "2", status: "available" }
          ]
        },
        {
          id: 5,
          room_no: "202",
          room_type: "quad",
          capacity: 4,
          status: "available",
          beds: [
            { id: 12, bed_no: "1", status: "available" },
            { id: 13, bed_no: "2", status: "available" },
            { id: 14, bed_no: "3", status: "available" },
            { id: 15, bed_no: "4", status: "available" }
          ]
        }
      ]
    },
    {
      floor_no: "G",
      floor_map_url: "https://via.placeholder.com/400x300?text=Ground+Floor+Layout",
      rooms: [
        {
          id: 6,
          room_no: "G01",
          room_type: "triple",
          capacity: 3,
          status: "occupied",
          beds: [
            { id: 16, bed_no: "1", status: "occupied" },
            { id: 17, bed_no: "2", status: "occupied" },
            { id: 18, bed_no: "3", status: "occupied" }
          ]
        }
      ]
    }
  ];

  const [floors, setFloors] = useState(demoFloors);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Set first floor as selected by default
  const [selectedFloor, setSelectedFloor] = useState(demoFloors[0]);
  const [selectedRoom, setSelectedRoom] = useState(demoFloors[0]?.rooms?.[0] || null);

  // Modals
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBed, setEditingBed] = useState(null);

  // Form states
  const [floorForm, setFloorForm] = useState({
    floor_no: "",
    floor_map_url: "",
  });

  const [roomForm, setRoomForm] = useState({
    room_no: "",
    room_type: "double",
    capacity: 2,
    status: "available",
  });

  const [bedForm, setBedForm] = useState({
    bed_no: "",
    status: "available",
  });

  const [mapFile, setMapFile] = useState(null);

  // Room type options
  const roomTypes = [
    { value: "single", label: "Single", capacity: 1 },
    { value: "double", label: "Double", capacity: 2 },
    { value: "triple", label: "Triple", capacity: 3 },
    { value: "quad", label: "Quad", capacity: 4 },
    { value: "quint", label: "Quint", capacity: 5 },
  ];

  const bedStatuses = ["available", "occupied", "maintenance"];
  const roomStatuses = ["available", "occupied", "maintenance", "reserved"];

  // Show alert
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false }), 4000);
  };

  // Add/Edit Floor
  const handleSaveFloor = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newFloor = {
        ...floorForm,
        hotel_id: hotelId,
        rooms: editingFloor ? editingFloor.rooms : [],
      };

      if (editingFloor) {
        // Update floor
        const updatedFloors = floors.map((f) =>
          f.floor_no === editingFloor.floor_no ? newFloor : f
        );
        setFloors(updatedFloors);
        showAlert("success", "Floor updated successfully!");
      } else {
        // Add new floor
        setFloors([...floors, newFloor]);
        showAlert("success", "Floor added successfully!");
      }

      setFloorForm({ floor_no: "", floor_map_url: "" });
      setEditingFloor(null);
      setShowFloorModal(false);
    } catch (error) {
      showAlert("danger", "Error saving floor");
    } finally {
      setLoading(false);
    }
  };

  // Add/Edit Room
  const handleSaveRoom = (e) => {
    e.preventDefault();

    if (!selectedFloor) {
      showAlert("danger", "Please select a floor first");
      return;
    }

    const newRoom = {
      ...roomForm,
      beds: editingRoom ? editingRoom.beds : [],
      id: editingRoom?.id || Date.now(),
    };

    const updatedFloors = floors.map((floor) => {
      if (floor.floor_no === selectedFloor.floor_no) {
        if (editingRoom) {
          return {
            ...floor,
            rooms: floor.rooms.map((r) =>
              r.id === editingRoom.id ? newRoom : r
            ),
          };
        } else {
          return {
            ...floor,
            rooms: [...(floor.rooms || []), newRoom],
          };
        }
      }
      return floor;
    });

    setFloors(updatedFloors);
    showAlert("success", `Room ${newRoom.room_no} saved successfully!`);
    setRoomForm({ room_no: "", room_type: "double", capacity: 2, status: "available" });
    setEditingRoom(null);
    setShowRoomModal(false);

    // Update selected floor to reflect changes
    setSelectedFloor(updatedFloors.find((f) => f.floor_no === selectedFloor.floor_no));
  };

  // Add/Edit Bed
  const handleSaveBed = (e) => {
    e.preventDefault();

    if (!selectedRoom) {
      showAlert("danger", "Please select a room first");
      return;
    }

    const newBed = {
      ...bedForm,
      id: editingBed?.id || Date.now(),
    };

    const updatedFloors = floors.map((floor) => {
      if (floor.floor_no === selectedFloor.floor_no) {
        return {
          ...floor,
          rooms: floor.rooms.map((room) => {
            if (room.id === selectedRoom.id) {
              if (editingBed) {
                return {
                  ...room,
                  beds: room.beds.map((b) =>
                    b.id === editingBed.id ? newBed : b
                  ),
                };
              } else {
                return {
                  ...room,
                  beds: [...(room.beds || []), newBed],
                };
              }
            }
            return room;
          }),
        };
      }
      return floor;
    });

    setFloors(updatedFloors);
    showAlert("success", `Bed ${newBed.bed_no} saved successfully!`);
    setBedForm({ bed_no: "", status: "available" });
    setEditingBed(null);
    setShowBedModal(false);

    // Update selected room
    setSelectedRoom(
      updatedFloors
        .find((f) => f.floor_no === selectedFloor.floor_no)
        .rooms.find((r) => r.id === selectedRoom.id)
    );
  };

  // Delete Floor
  const handleDeleteFloor = (floorNo) => {
    setFloors(floors.filter((f) => f.floor_no !== floorNo));
    showAlert("success", "Floor deleted successfully!");
    setSelectedFloor(null);
  };

  // Delete Room
  const handleDeleteRoom = (roomId) => {
    const updatedFloors = floors.map((floor) => {
      if (floor.floor_no === selectedFloor.floor_no) {
        return {
          ...floor,
          rooms: floor.rooms.filter((r) => r.id !== roomId),
        };
      }
      return floor;
    });

    setFloors(updatedFloors);
    showAlert("success", "Room deleted successfully!");
    setSelectedRoom(null);
  };

  // Delete Bed
  const handleDeleteBed = (bedId) => {
    const updatedFloors = floors.map((floor) => {
      if (floor.floor_no === selectedFloor.floor_no) {
        return {
          ...floor,
          rooms: floor.rooms.map((room) => {
            if (room.id === selectedRoom.id) {
              return {
                ...room,
                beds: room.beds.filter((b) => b.id !== bedId),
              };
            }
            return room;
          }),
        };
      }
      return floor;
    });

    setFloors(updatedFloors);
    showAlert("success", "Bed deleted successfully!");
  };

  // Submit to API
  const handleSubmitRoomMap = async () => {
    setLoading(true);

    try {
      const payload = {
        hotel_id: hotelId,
        floors: floors.map((floor) => ({
          floor_no: floor.floor_no,
          floor_map_url: floor.floor_map_url,
          rooms: floor.rooms.map((room) => ({
            room_no: room.room_no,
            room_type: room.room_type,
            capacity: room.capacity,
            status: room.status,
            beds: (room.beds || []).map((bed) => ({
              bed_no: bed.bed_no,
              status: bed.status,
            })),
          })),
        })),
      };

      const token = localStorage.getItem("accessToken");
      await axios.post("http://127.0.0.1:8000/api/hotels/room-map", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Room map submitted successfully!");
      if (onSaved) onSaved();
    } catch (error) {
      showAlert("danger", error.response?.data?.message || "Error submitting room map");
    } finally {
      setLoading(false);
    }
  };

  // Edit Floor Handler
  const handleEditFloor = (floor) => {
    setEditingFloor(floor);
    setFloorForm({
      floor_no: floor.floor_no,
      floor_map_url: floor.floor_map_url,
    });
    setShowFloorModal(true);
  };

  // Edit Room Handler
  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_no: room.room_no,
      room_type: room.room_type,
      capacity: room.capacity,
      status: room.status,
    });
    setShowRoomModal(true);
  };

  // Edit Bed Handler
  const handleEditBed = (bed) => {
    setEditingBed(bed);
    setBedForm({
      bed_no: bed.bed_no,
      status: bed.status,
    });
    setShowBedModal(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      available: "success",
      occupied: "danger",
      maintenance: "warning",
      reserved: "info",
    };
    return <Badge bg={statusColors[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <Card className="shadow-sm">
      {alert.show && (
        <Alert variant={alert.type} onClose={() => setAlert({ show: false })} dismissible className="m-3">
          {alert.message}
        </Alert>
      )}

      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">
            <Grid3x3 size={20} className="me-2" />
            Room & Bed Map Management
          </h5>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSubmitRoomMap}
            disabled={loading || floors.length === 0}
          >
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Save Room Map to API
          </Button>
        </div>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
          {/* Floors Tab */}
          <Tab eventKey="floors" title={`Floors (${floors.length})`}>
            <div className="mt-3">
              <Button
                size="sm"
                variant="success"
                onClick={() => {
                  setEditingFloor(null);
                  setFloorForm({ floor_no: "", floor_map_url: "" });
                  setShowFloorModal(true);
                }}
                className="mb-3"
              >
                <Plus size={16} className="me-2" />
                Add Floor
              </Button>

              {floors.length === 0 ? (
                <Alert variant="info">No floors added yet. Create a floor to get started.</Alert>
              ) : (
                <div className="row g-2">
                  {floors.map((floor) => (
                    <div key={floor.floor_no} className="col-md-4 col-sm-6">
                      <Card
                        className="cursor-pointer"
                        style={{ cursor: "pointer", border: selectedFloor?.floor_no === floor.floor_no ? "2px solid #0d6efd" : "1px solid #dee2e6" }}
                        onClick={() => setSelectedFloor(floor)}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">
                              <Home size={16} className="me-2" />
                              Floor {floor.floor_no}
                            </h6>
                            <div className="gap-1 d-flex">
                              <Button
                                size="sm"
                                variant="link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFloor(floor);
                                }}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFloor(floor.floor_no);
                                }}
                                className="text-danger"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                          <small className="text-muted d-block mb-2">
                            Rooms: {floor.rooms?.length || 0}
                          </small>
                          {floor.floor_map_url && (
                            <img
                              src={floor.floor_map_url}
                              alt="Floor map"
                              style={{ width: "100%", maxHeight: "100px", objectFit: "cover", borderRadius: "4px" }}
                            />
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tab>

          {/* Rooms Tab */}
          <Tab eventKey="rooms" title={`Rooms (${selectedFloor?.rooms?.length || 0})`}>
            <div className="mt-3">
              {!selectedFloor ? (
                <Alert variant="warning">Select a floor first to manage rooms</Alert>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomForm({ room_no: "", room_type: "double", capacity: 2, status: "available" });
                      setShowRoomModal(true);
                    }}
                    className="mb-3"
                  >
                    <Plus size={16} className="me-2" />
                    Add Room to Floor {selectedFloor.floor_no}
                  </Button>

                  {selectedFloor.rooms?.length === 0 ? (
                    <Alert variant="info">No rooms on this floor yet.</Alert>
                  ) : (
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Room No</th>
                          <th>Type</th>
                          <th>Capacity</th>
                          <th>Status</th>
                          <th>Beds</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFloor.rooms.map((room) => (
                          <tr
                            key={room.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedRoom(room)}
                          >
                            <td>
                              <strong>{room.room_no}</strong>
                            </td>
                            <td>{room.room_type}</td>
                            <td>
                              <Badge bg="info">{room.capacity}</Badge>
                            </td>
                            <td>{getStatusBadge(room.status)}</td>
                            <td>
                              <Badge bg="secondary">{room.beds?.length || 0}</Badge>
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRoom(room);
                                }}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(room.id);
                                }}
                                className="text-danger"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </>
              )}
            </div>
          </Tab>

          {/* Beds Tab */}
          <Tab eventKey="beds" title={`Beds (${selectedRoom?.beds?.length || 0})`}>
            <div className="mt-3">
              {!selectedRoom ? (
                <Alert variant="warning">Select a room first to manage beds</Alert>
              ) : (
                <>
                  <div className="mb-3 p-3 bg-light rounded">
                    <small className="text-muted d-block">
                      Floor {selectedFloor?.floor_no} - Room {selectedRoom.room_no} ({selectedRoom.room_type})
                    </small>
                  </div>

                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      setEditingBed(null);
                      setBedForm({ bed_no: "", status: "available" });
                      setShowBedModal(true);
                    }}
                    className="mb-3"
                  >
                    <Plus size={16} className="me-2" />
                    Add Bed
                  </Button>

                  {selectedRoom.beds?.length === 0 ? (
                    <Alert variant="info">No beds in this room yet.</Alert>
                  ) : (
                    <div className="row g-2">
                      {selectedRoom.beds.map((bed) => (
                        <div key={bed.id} className="col-md-4 col-sm-6">
                          <Card>
                            <Card.Body className="p-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  <Bed size={16} className="me-2" />
                                  <div>
                                    <small className="fw-bold">Bed {bed.bed_no}</small>
                                    <br />
                                    <small>{getStatusBadge(bed.status)}</small>
                                  </div>
                                </div>
                                <div className="gap-1 d-flex">
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="p-0"
                                    onClick={() => handleEditBed(bed)}
                                  >
                                    <Edit2 size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="p-0 text-danger"
                                    onClick={() => handleDeleteBed(bed.id)}
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </Tab>
        </Tabs>
      </Card.Body>

      {/* Floor Modal */}
      <Modal show={showFloorModal} onHide={() => setShowFloorModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Home size={20} className="me-2" />
            {editingFloor ? "Edit Floor" : "Add Floor"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveFloor}>
            <Form.Group className="mb-3">
              <Form.Label>Floor Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., 1, 2, G, B1"
                value={floorForm.floor_no}
                onChange={(e) => setFloorForm({ ...floorForm, floor_no: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Floor Map Image URL</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://..."
                value={floorForm.floor_map_url}
                onChange={(e) => setFloorForm({ ...floorForm, floor_map_url: e.target.value })}
              />
              <Form.Text>Optional: URL to floor layout image</Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary">
                {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Save Floor
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowFloorModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Room Modal */}
      <Modal show={showRoomModal} onHide={() => setShowRoomModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Home size={20} className="me-2" />
            {editingRoom ? "Edit Room" : "Add Room"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveRoom}>
            <Form.Group className="mb-3">
              <Form.Label>Room Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., 201, 202"
                value={roomForm.room_no}
                onChange={(e) => setRoomForm({ ...roomForm, room_no: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Room Type</Form.Label>
                  <Form.Select
                    value={roomForm.room_type}
                    onChange={(e) => {
                      const selected = roomTypes.find((rt) => rt.value === e.target.value);
                      setRoomForm({
                        ...roomForm,
                        room_type: e.target.value,
                        capacity: selected?.capacity || 2,
                      });
                    }}
                  >
                    {roomTypes.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control type="number" value={roomForm.capacity} disabled />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={roomForm.status}
                onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
              >
                {roomStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary">
                Save Room
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowRoomModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Bed Modal */}
      <Modal show={showBedModal} onHide={() => setShowBedModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Bed size={20} className="me-2" />
            {editingBed ? "Edit Bed" : "Add Bed"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveBed}>
            <Form.Group className="mb-3">
              <Form.Label>Bed Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., 1, 2, A, B"
                value={bedForm.bed_no}
                onChange={(e) => setBedForm({ ...bedForm, bed_no: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={bedForm.status}
                onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })}
              >
                {bedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary">
                Save Bed
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowBedModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default RoomMapManager;
