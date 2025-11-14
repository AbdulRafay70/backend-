import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import { Modal, Button, ListGroup } from "react-bootstrap";
import AdminFooter from "../../components/AdminFooter";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const tabs = [
  { name: "Umrah Package", path: "/packages" },
  { name: "Visa and others", path: "/packages/visa-and-other" },
];

const Visa = () => {
  const token = localStorage.getItem("accessToken");
  const selectedOrg = JSON.parse(localStorage.getItem("selectedOrganization"));

  const [isEditingVisa28, setIsEditingVisa28] = useState(false);
  const [isEditingVisaLong, setIsEditingVisaLong] = useState(false);
  const [isEditingVisa28Only, setIsEditingVisa28Only] = useState(false);
  const [isEditingVisaLongOnly, setIsEditingVisaLongOnly] = useState(false);

  // Loading states
  const [isAddingFlight, setIsAddingFlight] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);

  // Section 1: Riyal Rate
  const [riyalSettings, setRiyalSettings] = useState({
    rate: "",
    is_visa_pkr: false,
    is_hotel_pkr: false,
    is_transport_pkr: false,
    is_ziarat_pkr: false,
    is_food_pkr: false,
    organization: selectedOrg?.id || 0,
  });

  const [isSettingRiyalRate, setIsSettingRiyalRate] = useState(false);

  const handleRiyalRateChange = (e) => {
    setRiyalSettings({
      ...riyalSettings,
      rate: e.target.value,
    });
  };

  const [isEditingRiyalRate, setIsEditingRiyalRate] = useState(false);

  // Add this useEffect to fetch existing riyal rate on component mount
  useEffect(() => {
    const fetchRiyalRate = async () => {
      const orgId =
        typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/riyal-rates/?organization=${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // If data exists, set it to state
        if (response.data && response.data.length > 0) {
          const existingData = response.data[0]; // assuming the API returns an array
          setRiyalSettings({
            rate: existingData.rate || "",
            is_visa_pkr: existingData.is_visa_pkr || false,
            is_hotel_pkr: existingData.is_hotel_pkr || false,
            is_transport_pkr: existingData.is_transport_pkr || false,
            is_ziarat_pkr: existingData.is_ziarat_pkr || false,
            is_food_pkr: existingData.is_food_pkr || false,
            organization: orgId,
          });
        }
      } catch (error) {
        console.error("Error fetching riyal rate:", error);
        toast.error("Failed to fetch riyal rate");
      }
    };

    fetchRiyalRate();
  }, []);

  // Modify the handleSetRiyalRate function to handle both create and update
  const handleSetRiyalRate = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!riyalSettings.rate) {
      toast.warning("Please enter Riyal Rate");
      return;
    }

    setIsSettingRiyalRate(true);

    try {
      // First try to fetch existing rate to determine if we should update
      const existingResponse = await axios.get(
        `http://127.0.0.1:8000/api/riyal-rates/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (existingResponse.data && existingResponse.data.length > 0) {
        // Update existing
        await axios.put(
          `http://127.0.0.1:8000/api/riyal-rates/${existingResponse.data[0].id}/?organization=${orgId}`,
          {
            ...riyalSettings,
            rate: parseFloat(riyalSettings.rate),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Riyal Rate settings updated successfully!");
      } else {
        // Create new
        await axios.post(
          "http://127.0.0.1:8000/api/riyal-rates/",
          {
            ...riyalSettings,
            rate: parseFloat(riyalSettings.rate),
            organization: orgId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Riyal Rate settings saved successfully!");
      }
      setIsEditingRiyalRate(false);
    } catch (error) {
      console.error("Error setting riyal rate:", error);
      toast.error("Failed to set riyal rate");
    } finally {
      setIsSettingRiyalRate(false);
    }
  };

  // Add this function to handle edit mode toggle
  const toggleEditMode = () => {
    setIsEditingRiyalRate(!isEditingRiyalRate);
  };

  // Section 2: Shirka Name
  const [shirkaName, setShirkaName] = useState("");
  const [removeShirka, setRemoveShirka] = useState("");
  // New states for Shirkah management
  const [shirkas, setShirkas] = useState([]);
  const [isLoadingShirkas, setIsLoadingShirkas] = useState(false);

  // Delete confirmation modals
  const [showDeleteShirkaModal, setShowDeleteShirkaModal] = useState(false);
  const [showDeleteTransportModal, setShowDeleteTransportModal] =
    useState(false);
  const [showDeleteTransportType2Modal, setShowDeleteTransportType2Modal] =
    useState(false);
  const [showDeleteVisaModal, setShowDeleteVisaModal] = useState(false);
  const [showDeleteFlightModal, setShowDeleteFlightModal] = useState(false);
  const [showDeleteCityModal, setShowDeleteCityModal] = useState(false);

  // Fetch shirkas on component mount
  useEffect(() => {
    fetchShirkas();
  }, []);

  // Function to fetch shirkas
  const fetchShirkas = async () => {
    setIsLoadingShirkas(true);
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/shirkas/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setShirkas(response.data);
    } catch (error) {
      console.error("Error fetching shirkas:", error.response?.data || error);
      toast.error(
        "Failed to load shirkas: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsLoadingShirkas(false);
    }
  };

  // Function to add a new shirka
  const handleAddShirka = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!shirkaName) {
      toast.warning("Please enter a shirka name");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/shirkas/",
        {
          name: shirkaName,
          organization: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Shirka added successfully!");
      fetchShirkas(); // Refresh the list
      setShirkaName(""); // Reset input
    } catch (error) {
      console.error("Error adding shirka:", error.response?.data || error);
      toast.error(
        "Failed to add shirka: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  const [editingShirkaId, setEditingShirkaId] = useState(null);

  const handleUpdateShirka = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!shirkaName || !editingShirkaId) {
      toast.warning("Please select a shirka to edit and enter a name");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/shirkas/${editingShirkaId}/?organization=${orgId}`,
        {
          name: shirkaName,
          organization: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Shirka updated successfully!");
      fetchShirkas(); // Refresh the list
      setShirkaName("");
      setEditingShirkaId(null);
      setRemoveShirka("");
    } catch (error) {
      console.error("Error updating shirka:", error.response?.data || error);
      toast.error(
        "Failed to update shirka: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  // Function to remove a shirka
  const handleRemoveShirka = async () => {
    if (!removeShirka) {
      toast.warning("Please select a shirka to remove");
      return;
    }

    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/shirkas/${removeShirka}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Shirka removed successfully!");
      fetchShirkas(); // Refresh the list
      setRemoveShirka(""); // Reset selection
      setShowDeleteShirkaModal(false);
    } catch (error) {
      console.error("Error removing shirka:", error.response?.data || error);
      toast.error(
        "Failed to remove shirka: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  // Section : Sector Name
  const [departureCity, setDepartureCity] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNumberSector, setContactNumberSector] = useState("");
  const [removeSector, setRemoveSector] = useState("");

  // State for sectors and cities
  const [sectors, setSectors] = useState([]);
  const [citiesSector, setCitiesSector] = useState([]);

  // Loading states
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [isLoadingCitiesSector, setIsLoadingCitiesSector] = useState(false);

  // Delete confirmation modals
  const [showDeleteSectorModal, setShowDeleteSectorModal] = useState(false);

  // Fetch Sectors and Cities on component mount
  useEffect(() => {
    fetchSectors();
    fetchCitiesSector();
  }, []);

  // Function to fetch Cities
  const fetchCitiesSector = async () => {
    setIsLoadingCities(true);
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/cities/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCitiesSector(response.data);
    } catch (error) {
      console.error("Error fetching Cities:", error.response?.data || error);
      toast.error(
        "Failed to load Cities: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsLoadingCitiesSector(false);
    }
  };

  // Function to fetch Sectors
  const fetchSectors = async () => {
    setIsLoadingSectors(true);
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/sectors/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSectors(response.data);
    } catch (error) {
      console.error("Error fetching Sectors:", error.response?.data || error);
      toast.error(
        "Failed to load Sectors: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsLoadingSectors(false);
    }
  };

  // Function to add a new Sector
  const handleAddSector = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!departureCity || !arrivalCity) {
      toast.warning("Please select both departure and arrival citiesSector");
      return;
    }

    if (departureCity === arrivalCity) {
      toast.warning("Departure and arrival citiesSector cannot be the same");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/sectors/",
        {
          contact_name: contactName,
          contact_number: contactNumberSector,
          departure_city: parseInt(departureCity),
          arrival_city: parseInt(arrivalCity),
          organization: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Sector added successfully!");
      fetchSectors(); // Refresh the list
      // Reset form
      setDepartureCity("");
      setArrivalCity("");
      setContactName("");
      setContactNumberSector("");
    } catch (error) {
      console.error("Error adding Sector:", error.response?.data || error);
      toast.error(
        "Failed to add Sector: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  const [editingSectorId, setEditingSectorId] = useState(null);

  const getCityNameBig = (id) => {
    const city = cities.find((c) => c.id === id);
    return city ? city.name : `City#${id}`;
  };

  const getSectorLabel = (sectorId) => {
    const sector = smallSectors.find((s) => s.id === sectorId);
    if (!sector) return `Sector#${sectorId}`;
    return `${getCityNameBig(sector.departure_city)} → ${getCityNameBig(sector.arrival_city)}`;
  };

  const handleUpdateSector = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!departureCity || !arrivalCity || !editingSectorId) {
      toast.warning("Please select a Sector to edit and enter required fields");
      return;
    }

    if (departureCity === arrivalCity) {
      toast.warning("Departure and arrival cities cannot be the same");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/sectors/${editingSectorId}/?organization=${orgId}`,
        {
          contact_name: contactName,
          contact_number: contactNumberSector,
          departure_city: parseInt(departureCity),
          arrival_city: parseInt(arrivalCity),
          organization: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Sector updated successfully!");
      fetchSectors(); // Refresh the list
      // Reset form
      setDepartureCity("");
      setArrivalCity("");
      setContactName("");
      setContactNumberSector("");
      setEditingSectorId(null);
      setRemoveSector("");
    } catch (error) {
      console.error("Error updating Sector:", error.response?.data || error);
      toast.error(
        "Failed to update Sector: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  // Function to remove a Sector
  const handleRemoveSector = async () => {
    if (!removeSector) {
      toast.warning("Please select a Sector to remove");
      return;
    }

    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/sectors/${removeSector}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Sector removed successfully!");
      fetchSectors(); // Refresh the list
      setRemoveSector(""); // Reset selection
      setShowDeleteSectorModal(false);
    } catch (error) {
      console.error("Error removing Sector:", error.response?.data || error);
      toast.error(
        "Failed to remove Sector: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  // Function to populate form when selecting a sector for editing
  const handleSectorSelect = (sectorId) => {
    setRemoveSector(sectorId);
    if (sectorId) {
      const selectedSector = sectors.find((s) => s.id.toString() === sectorId);
      if (selectedSector) {
        setDepartureCity(selectedSector.departure_city.toString());
        setArrivalCity(selectedSector.arrival_city.toString());
        setContactName(selectedSector.contact_name || "");
        setContactNumberSector(selectedSector.contact_number || "");
        setEditingSectorId(selectedSector.id);
      }
    } else {
      // Reset form if no sector selected
      setDepartureCity("");
      setArrivalCity("");
      setContactName("");
      setContactNumberSector("");
      setEditingSectorId(null);
    }
  };

  // Helper function to get city name by ID
  const getCityName = (cityId) => {
    const city = citiesSector.find(
      (c) => c.id.toString() === cityId.toString()
    );
    return city ? `${city.name} (${city.code})` : `City ${cityId}`;
  };

  // big sector 
  const [bigSectors, setBigSectors] = useState([]);
  const [smallSectors, setSmallSectors] = useState([]);
  const [selectedSmallSectors, setSelectedSmallSectors] = useState([]);
  const [editingIdBig, setEditingIdBig] = useState(null);
  const [removeId, setRemoveId] = useState("");
  const [loadingBig, setLoadingBig] = useState(false);

  // ✅ Fetch all BigSectors
  const fetchBigSectors = async () => {
    setLoadingBig(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/big-sectors/?organization=${orgId}`);
      setBigSectors(res.data);
    } catch (err) {
      console.error("Error fetching big sectors", err);
      toast.error("Error fetching big sectors");
    } finally {
      setLoadingBig(false);
    }
  };

  // ✅ Fetch all SmallSectors
  const fetchSmallSectors = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/sectors/?organization=${orgId}`);
      setSmallSectors(res.data);
    } catch (err) {
      console.error("Error fetching small sectors", err);
      toast.error("Error fetching small sectors");
    }
  };

  useEffect(() => {
    fetchBigSectors();
    fetchSmallSectors();
  }, []);
  // ✅ Add BigSector with sequential validation
  const handleAdd = async () => {
    try {
      if (selectedSmallSectors.length === 0) {
        toast.warning("Please select at least one sector");
        return;
      }

      // Get sectors in selected order
      const selectedSectorsInOrder = selectedSmallSectors.map(id =>
        smallSectors.find(s => s.id === parseInt(id))
      ).filter(Boolean);

      // Validate sequential chain
      if (selectedSectorsInOrder.length > 1) {
        for (let i = 0; i < selectedSectorsInOrder.length - 1; i++) {
          const currentSector = selectedSectorsInOrder[i];
          const nextSector = selectedSectorsInOrder[i + 1];

          const currentArrival = getCityName(currentSector.arrival_city);
          const nextDeparture = getCityName(nextSector.departure_city);

          // Get first 3 letters for comparison
          const currentArrivalCode = currentArrival?.substring(0, 3).toUpperCase();
          const nextDepartureCode = nextDeparture?.substring(0, 3).toUpperCase();

          if (currentArrivalCode !== nextDepartureCode) {
            toast.error(`Sectors not sequential! ${currentArrival} → ${nextDeparture} (${currentArrivalCode} ≠ ${nextDepartureCode})`);
            return;
          }
        }
      }

      await axios.post("http://127.0.0.1:8000/api/big-sectors/", {
        organization_id: parseInt(orgId),
        small_sector_ids: selectedSmallSectors.map(Number),
      });

      fetchBigSectors();
      setSelectedSmallSectors([]);
      toast.success("BigSector added successfully!");
    } catch (err) {
      console.error("Error adding BigSector", err);
      toast.error("Error adding BigSector: " + (err.response?.data?.detail || err.message));
    }
  };

  // ✅ Update BigSector with sequential validation
  const handleUpdate = async () => {
    try {
      if (selectedSmallSectors.length === 0) {
        toast.warning("Please select at least one sector");
        return;
      }

      // Get sectors in selected order
      const selectedSectorsInOrder = selectedSmallSectors.map(id =>
        smallSectors.find(s => s.id === parseInt(id))
      ).filter(Boolean);

      // Validate sequential chain
      if (selectedSectorsInOrder.length > 1) {
        for (let i = 0; i < selectedSectorsInOrder.length - 1; i++) {
          const currentSector = selectedSectorsInOrder[i];
          const nextSector = selectedSectorsInOrder[i + 1];

          const currentArrival = getCityName(currentSector.arrival_city);
          const nextDeparture = getCityName(nextSector.departure_city);

          const currentArrivalCode = currentArrival?.substring(0, 3).toUpperCase();
          const nextDepartureCode = nextDeparture?.substring(0, 3).toUpperCase();

          if (currentArrivalCode !== nextDepartureCode) {
            toast.error(`Sectors not sequential! ${currentArrival} → ${nextDeparture} (${currentArrivalCode} ≠ ${nextDepartureCode})`);
            return;
          }
        }
      }

      await axios.put(`http://127.0.0.1:8000/api/big-sectors/${editingIdBig}/`, {
        organization_id: parseInt(orgId),
        small_sector_ids: selectedSmallSectors.map(Number),
      });

      fetchBigSectors();
      setEditingIdBig(null);
      setSelectedSmallSectors([]);
      setRemoveId("");
      toast.success("BigSector updated successfully!");
    } catch (err) {
      console.error("Error updating BigSector", err);
      toast.error("Error updating BigSector: " + (err.response?.data?.detail || err.message));
    }
  };

  // ✅ Display function showing sequential chain
  const getBigSectorDropdownDisplay = (bigSector) => {
    if (!bigSector.small_sectors || bigSector.small_sectors.length === 0) {
      return "No sectors";
    }

    const cityCodes = [];

    // Always start with first sector's departure
    const firstSector = bigSector.small_sectors[0];
    const firstDeparture = getCityName(firstSector.departure_city)?.substring(0, 3).toUpperCase();
    cityCodes.push(firstDeparture);

    // Add all arrival cities
    bigSector.small_sectors.forEach((sector) => {
      const arrivalCode = getCityName(sector.arrival_city)?.substring(0, 3).toUpperCase();
      cityCodes.push(arrivalCode);
    });

    return cityCodes.join('-');
  };

  // ✅ Real-time validation in UI
  const validateSelectedSectors = () => {
    if (selectedSmallSectors.length < 2) return { isValid: true, message: "" };

    const selectedSectors = selectedSmallSectors.map(id =>
      smallSectors.find(s => s.id === parseInt(id))
    ).filter(Boolean);

    for (let i = 0; i < selectedSectors.length - 1; i++) {
      const currentSector = selectedSectors[i];
      const nextSector = selectedSectors[i + 1];

      const currentArrival = getCityName(currentSector.arrival_city);
      const nextDeparture = getCityName(nextSector.departure_city);

      const currentArrivalCode = currentArrival?.substring(0, 3).toUpperCase();
      const nextDepartureCode = nextDeparture?.substring(0, 3).toUpperCase();

      if (currentArrivalCode !== nextDepartureCode) {
        return {
          isValid: false,
          message: `❌ Broken at position ${i + 1}: ${currentArrival} ≠ ${nextDeparture}`
        };
      }
    }

    return { isValid: true, message: "✅ Sequential sectors" };
  };

  // ✅ Enhanced optimizeSectorChain function with better error handling
  const optimizeSectorChain = (sectors) => {
    if (!sectors || sectors.length === 0) return [];

    const used = new Set();
    const result = [];

    // Helper function to get city code
    const getCityCode = (cityId) => {
      const cityName = getCityName(cityId);
      return cityName ? cityName.substring(0, 3).toUpperCase() : `CITY${cityId}`;
    };

    // Find starting point (sector whose departure city is not an arrival city of any other sector)
    let current = sectors.find(sector => {
      const departureCode = getCityCode(sector.departure_city);
      return !sectors.some(s => getCityCode(s.arrival_city) === departureCode);
    });

    // If no starting point found, just use the first sector
    if (!current) current = sectors[0];

    result.push(current);
    used.add(current.id);

    // Build chain ensuring continuity
    while (result.length < sectors.length) {
      const lastSector = result[result.length - 1];
      const lastArrivalCode = getCityCode(lastSector.arrival_city);

      // Find next sector where departure matches last arrival
      const nextSector = sectors.find(sector =>
        !used.has(sector.id) && getCityCode(sector.departure_city) === lastArrivalCode
      );

      if (nextSector) {
        result.push(nextSector);
        used.add(nextSector.id);
      } else {
        // If no direct connection found, try to find any unused sector
        const remainingSector = sectors.find(sector => !used.has(sector.id));
        if (remainingSector) {
          // Check if we can insert this sector somewhere in the chain
          const insertionIndex = findInsertionPoint(result, remainingSector, sectors, getCityCode);
          if (insertionIndex !== -1) {
            result.splice(insertionIndex, 0, remainingSector);
            used.add(remainingSector.id);
          } else {
            // If cannot be inserted, add to the end (this will break the chain)
            result.push(remainingSector);
            used.add(remainingSector.id);
          }
        } else {
          break;
        }
      }
    }

    return result;
  };

  // ✅ Helper function to find where a sector can be inserted in the chain
  const findInsertionPoint = (currentChain, newSector, allSectors, getCityCode) => {
    const newDepartureCode = getCityCode(newSector.departure_city);
    const newArrivalCode = getCityCode(newSector.arrival_city);

    // Check if it can be inserted at the beginning
    if (currentChain.length > 0) {
      const firstDepartureCode = getCityCode(currentChain[0].departure_city);
      if (newArrivalCode === firstDepartureCode) {
        return 0; // Insert at beginning
      }
    }

    // Check insertion points between existing sectors
    for (let i = 0; i < currentChain.length - 1; i++) {
      const currentArrivalCode = getCityCode(currentChain[i].arrival_city);
      const nextDepartureCode = getCityCode(currentChain[i + 1].departure_city);

      if (newDepartureCode === currentArrivalCode && newArrivalCode === nextDepartureCode) {
        return i + 1; // Insert between current and next
      }
    }

    // Check if it can be appended to the end
    if (currentChain.length > 0) {
      const lastArrivalCode = getCityCode(currentChain[currentChain.length - 1].arrival_city);
      if (newDepartureCode === lastArrivalCode) {
        return currentChain.length; // Append to end
      }
    }

    return -1; // Cannot be inserted maintaining continuity
  };

  // ✅ Delete BigSector
  const handleDeleteBig = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/big-sectors/${removeId}/`);
      fetchBigSectors();
      setRemoveId("");
      setSelectedSmallSectors([]);
      setEditingIdBig(null);
      toast.success("BigSector deleted successfully!");
    } catch (err) {
      console.error("Error deleting BigSector", err);
      toast.error("Error deleting BigSector");
    }
  };

  // ✅ Edit BigSector - Load existing data into form
  const handleEditBig = (bigSectorId) => {
    const bigSector = bigSectors.find(bs => bs.id === parseInt(bigSectorId));
    if (bigSector) {
      setEditingIdBig(bigSectorId);
      setRemoveId(bigSectorId);

      const smallSectorIds = bigSector.small_sectors?.map(sector => sector.id.toString()) || [];
      setSelectedSmallSectors(smallSectorIds);

      toast.info(`Editing BigSector with ${smallSectorIds.length} sectors`);
    }
  };

  // ✅ Cancel edit
  const handleCancelEdit = () => {
    setEditingIdBig(null);
    setSelectedSmallSectors([]);
    setRemoveId("");
    toast.info("Edit cancelled");
  };


  const [activeRate, setActiveRate] = useState("rate1"); // 'rate1' or 'rate2'
  const [activeTypes, setActiveTypes] = useState("type1"); // 'type1' or 'type2'
  const [isSettingVisaType, setIsSettingVisaType] = useState(false);
  const [currentVisaType, setCurrentVisaType] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [visaTypeId, setVisaTypeId] = useState(null);
  const [isVisaTypeLoading, setIsVisaTypeLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [visaTypeName, setVisaTypeName] = useState(""); // 🆕 for showing name from API

  const fetchCurrentVisaType = async () => {
    try {
      setIsVisaTypeLoading(true);
      const orgId = selectedOrg?.id || selectedOrg;
      const response = await axios.get(
        `http://127.0.0.1:8000/api/set-visa-type/?organization=${orgId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.length > 0) {
        const visaData = response.data[0];
        if (visaData.name === "type1") {
          setCurrentVisaType("type1");
          setActiveType("type1");
        } else if (visaData.name === "type2") {
          setCurrentVisaType("type2");
          setActiveType("type2");
        }
        setVisaTypeName(visaData.name || "");
        setVisaTypeId(visaData.id || null);
      } else {
        setCurrentVisaType(null);
        setVisaTypeName("");
        setActiveType(null);
        setVisaTypeId(null);
      }
    } catch (error) {
      console.error("Fetch visa type error:", error);
    } finally {
      setIsVisaTypeLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentVisaType();
  }, []);

  // Save visa type
  const saveVisaType = async () => {
    if (!activeType) {
      toast.warning("Please select a type first");
      return;
    }

    setIsSaving(true);
    try {
      const orgId =
        typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
      const payload = {
        name: `type${activeType === "type1" ? "1" : "2"}`,
        active_type: activeType,
        organization: orgId,
      };

      const url = visaTypeId
        ? `http://127.0.0.1:8000/api/set-visa-type/${visaTypeId}/?organization=${orgId}`
        : `http://127.0.0.1:8000/api/set-visa-type/?organization=${orgId}`;

      const method = visaTypeId ? "put" : "post";

      const response = await axios[method](url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setCurrentVisaType(activeType);
      setVisaTypeName(payload.name);
      if (!visaTypeId) {
        setVisaTypeId(response.data.id);
      }

      toast.success(
        `Visa type ${visaTypeId ? "updated" : "set"} successfully!`
      );
    } catch (error) {
      console.error("Error saving visa type:", error);
      toast.error(
        `Failed to save visa type: ${error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckboxChange = (field) => {
    setActiveTypes({
      ...activeTypes,
      [field]: !activeTypes[field],
    });
  };

  // Section 3: Umrah Visa with 28 days stay + Hotels
  const [visa28Adult, setVisa28Adult] = useState("");
  const [visa28Child, setVisa28Child] = useState("");
  const [visa28Infants, setVisa28Infants] = useState("");
  const [visa28MaxNights, setVisa28MaxNights] = useState("");

  const [isSettingVisaPrice, setIsSettingVisaPrice] = useState(false);
  const [visaPrices, setVisaPrices] = useState([]);
  const [editingVisaPriceId, setEditingVisaPriceId] = useState(null);
  const [isLoadingVisaPrices, setIsLoadingVisaPrices] = useState(false);

  const fetchVisaPrices = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setIsLoadingVisaPrices(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Ensure response.data is an array
      const prices = Array.isArray(response.data) ? response.data : [];
      setVisaPrices(prices);

      // Find and set the editing price if it exists
      const shortWithHotel = prices.find(
        (price) =>
          price?.category === "short stay with hotel" &&
          price?.visa_type === "type1"
      );

      if (shortWithHotel) {
        setEditingVisaPriceId(shortWithHotel.id);
        setVisa28Adult(shortWithHotel.adault_price?.toString() || "");
        setVisa28Child(shortWithHotel.child_price?.toString() || "");
        setVisa28Infants(shortWithHotel.infant_price?.toString() || "");
        setVisa28MaxNights(shortWithHotel.maximum_nights?.toString() || "");
      } else {
        setEditingVisaPriceId(null);
        setVisa28Adult("");
        setVisa28Child("");
        setVisa28Infants("");
        setVisa28MaxNights("");
      }
    } catch (error) {
      console.error(
        "Error fetching visa prices:",
        error.response?.data || error
      );
      // Reset to default values on error
      setEditingVisaPriceId(null);
      setVisa28Adult("");
      setVisa28Child("");
      setVisa28Infants("");
      setVisa28MaxNights("");
    } finally {
      setIsLoadingVisaPrices(false);
    }
  };
  // both create and update
  const handleSetVisaPrice = async (type) => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!visa28Adult || !visa28Child || !visa28Infants || !visa28MaxNights) {
      toast.warning("Please fill all fields for Short Stay with Hotel");
      return;
    }

    setIsSettingVisaPrice(true);

    const visaPriceData = {
      visa_type: "type1",
      category: "short stay with hotel",
      adault_price: parseFloat(visa28Adult),
      child_price: parseFloat(visa28Child),
      infant_price: parseFloat(visa28Infants),
      maximum_nights: parseInt(visa28MaxNights),
      organization: orgId,
    };

    try {
      if (editingVisaPriceId) {
        await axios.put(
          `http://127.0.0.1:8000/api/umrah-visa-prices/${editingVisaPriceId}/?organization=${orgId}`,
          visaPriceData
        );
        toast.success("Visa prices updated successfully!");
      } else {
        const response = await axios.post(
          `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
          visaPriceData
        );
        setEditingVisaPriceId(response.data.id); // Store the new ID
        toast.success("Visa prices set successfully!");
      }

      // Don't immediately refetch - keep the current values
      setIsEditingVisa28(false); // Exit edit mode
    } catch (error) {
      console.error("Error setting visa prices:", error);
      toast.error("Failed to set visa prices");
    } finally {
      setIsSettingVisaPrice(false);
    }
  };

  useEffect(() => {
    if (selectedOrg && !isEditingVisa28) {
      fetchVisaPrices();
    }
  }, []);

  // Section 4: Umrah Visa with Long stay + Hotels
  const [visaLongAdult, setVisaLongAdult] = useState("");
  const [visaLongChild, setVisaLongChild] = useState("");
  const [visaLongInfants, setVisaLongInfants] = useState("");
  const [visaLongMaxNights, setVisaLongMaxNights] = useState("");

  const [visaLongPrices, setVisaLongPrices] = useState([]);
  const [editingVisaLongPriceId, setEditingVisaLongPriceId] = useState(null);
  const [isSettingVisaLongPrice, setIsSettingVisaLongPrice] = useState(false);
  const [isLoadingVisaLongPrices, setIsLoadingVisaLongPrices] = useState(false);

  const fetchVisaLongPrices = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setIsLoadingVisaLongPrices(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Ensure response.data is an array
      const prices = Array.isArray(response.data) ? response.data : [];
      setVisaLongPrices(prices);

      // Find and set the editing price if it exists
      const longWithHotel = prices.find(
        (price) =>
          price?.category === "long stay with hotel" &&
          price?.visa_type === "type1"
      );

      if (longWithHotel) {
        setEditingVisaLongPriceId(longWithHotel.id);
        setVisaLongAdult(longWithHotel.adault_price?.toString() || "");
        setVisaLongChild(longWithHotel.child_price?.toString() || "");
        setVisaLongInfants(longWithHotel.infant_price?.toString() || "");
        setVisaLongMaxNights(longWithHotel.maximum_nights?.toString() || "");
      } else {
        setEditingVisaLongPriceId(null);
        setVisaLongAdult("");
        setVisaLongChild("");
        setVisaLongInfants("");
        setVisaLongMaxNights("");
      }
    } catch (error) {
      console.error(
        "Error fetching visa prices:",
        error.response?.data || error
      );
      // Reset to default values on error
      setEditingVisaLongPriceId(null);
      setVisaLongAdult("");
      setVisaLongChild("");
      setVisaLongInfants("");
      setVisaLongMaxNights("");
    } finally {
      setIsLoadingVisaLongPrices(false);
    }
  };

  useEffect(() => {
    fetchVisaLongPrices();
  }, []);

  const handleSetVisaLongPrice = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (
      !visaLongAdult ||
      !visaLongChild ||
      !visaLongInfants ||
      !visaLongMaxNights
    ) {
      toast.warning("Please fill all fields");
      return;
    }

    setIsSettingVisaLongPrice(true);

    const visaPriceData = {
      visa_type: "type1",
      category: "long stay with hotel",
      adault_price: parseFloat(visaLongAdult),
      child_price: parseFloat(visaLongChild),
      infant_price: parseFloat(visaLongInfants),
      maximum_nights: parseInt(visaLongMaxNights),
      organization: orgId,
    };

    try {
      if (editingVisaLongPriceId) {
        // Update existing price
        await axios.put(
          `http://127.0.0.1:8000/api/umrah-visa-prices/${editingVisaLongPriceId}/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa prices updated successfully!");
      } else {
        // Create new price
        await axios.post(
          `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa prices set successfully!");
      }
      fetchVisaLongPrices(); // Refresh the list
    } catch (error) {
      console.error(
        "Error setting visa prices:",
        error.response?.data || error
      );
      toast.error(
        "Failed to set visa prices: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsSettingVisaLongPrice(false);
    }
  };

  // Section 5: Umrah Visa with 28 days stay
  const [visa28OnlyAdult, setVisa28OnlyAdult] = useState("");
  const [visa28OnlyChild, setVisa28OnlyChild] = useState("");
  const [visa28OnlyInfants, setVisa28OnlyInfants] = useState("");

  const [visa28OnlyPrices, setVisa28OnlyPrices] = useState([]);
  const [editingVisa28OnlyPriceId, setEditingVisa28OnlyPriceId] =
    useState(null);
  const [isSettingVisa28OnlyPrice, setIsSettingVisa28OnlyPrice] =
    useState(false);
  const [isLoadingVisa28OnlyPrices, setIsLoadingVisa28OnlyPrices] =
    useState(false);

  const fetchVisa28OnlyPrices = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setIsLoadingVisa28OnlyPrices(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const prices = Array.isArray(response.data) ? response.data : [];
      setVisa28OnlyPrices(prices);

      const existingPrice = prices.find(
        (price) =>
          price?.category === "short stay" && price?.visa_type === "type1"
      );

      if (existingPrice) {
        setEditingVisa28OnlyPriceId(existingPrice.id);
        setVisa28OnlyAdult(existingPrice.adault_price?.toString() || "");
        setVisa28OnlyChild(existingPrice.child_price?.toString() || "");
        setVisa28OnlyInfants(existingPrice.infant_price?.toString() || "");
      } else {
        setEditingVisa28OnlyPriceId(null);
        setVisa28OnlyAdult("");
        setVisa28OnlyChild("");
        setVisa28OnlyInfants("");
      }
    } catch (error) {
      console.error(
        "Error fetching visa prices:",
        error.response?.data || error
      );
      setEditingVisa28OnlyPriceId(null);
      setVisa28OnlyAdult("");
      setVisa28OnlyChild("");
      setVisa28OnlyInfants("");
    } finally {
      setIsLoadingVisa28OnlyPrices(false);
    }
  };

  const handleSetVisa28OnlyPrice = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!visa28OnlyAdult || !visa28OnlyChild || !visa28OnlyInfants) {
      toast.warning("Please fill all fields");
      return;
    }

    setIsSettingVisa28OnlyPrice(true);

    const visaPriceData = {
      visa_type: "type1",
      category: "short stay",
      adault_price: parseFloat(visa28OnlyAdult),
      child_price: parseFloat(visa28OnlyChild),
      infant_price: parseFloat(visa28OnlyInfants),
      organization: orgId,
    };

    try {
      if (editingVisa28OnlyPriceId) {
        await axios.put(
          `http://127.0.0.1:8000/api/umrah-visa-prices/${editingVisa28OnlyPriceId}/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa prices updated successfully!");
      } else {
        await axios.post(
          `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa prices set successfully!");
      }
      fetchVisa28OnlyPrices();
    } catch (error) {
      console.error(
        "Error setting visa prices:",
        error.response?.data || error
      );
      toast.error(
        "Failed to set visa prices: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsSettingVisa28OnlyPrice(false);
    }
  };

  useEffect(() => {
    fetchVisa28OnlyPrices();
  }, []);

  // Section 6: Umrah Visa with Long Stay
  const [visaLongOnlyAdult, setVisaLongOnlyAdult] = useState("");
  const [visaLongOnlyChild, setVisaLongOnlyChild] = useState("");
  const [visaLongOnlyInfants, setVisaLongOnlyInfants] = useState("");

  // State for long stay visa only (without hotels)
  const [visaLongOnlyPrices, setVisaLongOnlyPrices] = useState([]);
  const [editingVisaLongOnlyId, setEditingVisaLongOnlyId] = useState(null);
  const [isSettingVisaLongOnly, setIsSettingVisaLongOnly] = useState(false);
  const [isLoadingVisaLongOnly, setIsLoadingVisaLongOnly] = useState(false);

  const fetchVisaLongOnlyPrices = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setIsLoadingVisaLongOnly(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const prices = Array.isArray(response.data) ? response.data : [];
      setVisaLongOnlyPrices(prices);

      // Find existing price for this category and visa type
      const existingPrice = prices.find(
        (price) =>
          price?.category === "long stay" && price?.visa_type === "type1"
      );

      if (existingPrice) {
        setEditingVisaLongOnlyId(existingPrice.id);
        setVisaLongOnlyAdult(existingPrice.adault_price?.toString() || "");
        setVisaLongOnlyChild(existingPrice.child_price?.toString() || "");
        setVisaLongOnlyInfants(existingPrice.infant_price?.toString() || "");
      } else {
        setEditingVisaLongOnlyId(null);
        // Reset to defaults
        setVisaLongOnlyAdult("");
        setVisaLongOnlyChild("");
        setVisaLongOnlyInfants("");
      }
    } catch (error) {
      console.error("Error fetching long stay visa prices:", error);
      // Reset on error
      setEditingVisaLongOnlyId(null);
      setVisaLongOnlyAdult("");
      setVisaLongOnlyChild("");
      setVisaLongOnlyInfants("");
    } finally {
      setIsLoadingVisaLongOnly(false);
    }
  };

  const handleSetVisaLongOnlyPrice = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!visaLongOnlyAdult || !visaLongOnlyChild || !visaLongOnlyInfants) {
      toast.warning("Please fill all required fields");
      return;
    }

    setIsSettingVisaLongOnly(true);

    const visaPriceData = {
      visa_type: "type1",
      category: "long stay",
      adault_price: parseFloat(visaLongOnlyAdult),
      child_price: parseFloat(visaLongOnlyChild),
      infant_price: parseFloat(visaLongOnlyInfants),
      organization: orgId,
    };

    try {
      if (editingVisaLongOnlyId) {
        // Update existing
        await axios.put(
          `http://127.0.0.1:8000/api/umrah-visa-prices/${editingVisaLongOnlyId}/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Long stay visa prices updated successfully!");
      } else {
        // Create new
        await axios.post(
          `http://127.0.0.1:8000/api/umrah-visa-prices/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Long stay visa prices set successfully!");
      }
      fetchVisaLongOnlyPrices(); // Refresh data
    } catch (error) {
      console.error("Error setting long stay visa prices:", error);
      toast.error(
        "Failed to set prices: " +
        (error.response?.data?.detail || "Unknown error")
      );
    } finally {
      setIsSettingVisaLongOnly(false);
    }
  };

  useEffect(() => {
    fetchVisaLongOnlyPrices();
  }, [activeType]); // Refresh when visa type changes

  // Section 7: Transport sector
  const [transportSectors, setTransportSectors] = useState([]);
  const [editingTransportId, setEditingTransportId] = useState(null);
  const [isSettingTransport, setIsSettingTransport] = useState(false);
  const [isLoadingTransport, setIsLoadingTransport] = useState(false);

  // Input states
  const [transportSector, setTransportSector] = useState("");
  const [transportAdult, setTransportAdult] = useState("");
  const [transportChild, setTransportChild] = useState("");
  const [transportInfants, setTransportInfants] = useState("");
  const [withVisa, setWithVisa] = useState(false);
  const [vehicleType, setVehicleType] = useState("");
  const [removeTransport, setRemoveTransport] = useState("");
  const [onlyTran, setOnlyTran] = useState(false);

  const fetchTransportSectors = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setIsLoadingTransport(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/transport-sector-prices/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Ensure we always have an array with proper fields
      const sectors = Array.isArray(response.data)
        ? response.data.filter((sector) => sector.reference === "type1")
        : //   id: sector.id || 0,
        //   name: sector.name || "",
        //   vehicle_type: sector.vehicle_type || "",
        //   adault_price: sector.adault_price || 0,
        //   child_price: sector.child_price || 0,
        //   infant_price: sector.infant_price || 0,
        //   is_visa: sector.is_visa || false,
        // }))
        [];

      setTransportSectors(sectors);
      setRemoveTransport("");
    } catch (error) {
      console.error("Error fetching transport sectors:", error);
      setTransportSectors([]); // Reset to empty array on error
    } finally {
      setIsLoadingTransport(false);
    }
  };

  const handleAddTransportSector = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (
      !transportSector ||
      !transportAdult ||
      !transportChild ||
      !transportInfants ||
      !vehicleType
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    setIsSettingTransport(true);

    const transportData = {
      reference: "type1",
      name: transportSector,
      vehicle_type: vehicleType,
      adault_price: parseFloat(transportAdult),
      child_price: parseFloat(transportChild),
      infant_price: parseFloat(transportInfants),
      is_visa: withVisa,
      only_transport_charge: false,
      organization: orgId,
    };

    try {
      if (editingTransportId) {
        // Update existing
        await axios.put(
          `http://127.0.0.1:8000/api/transport-sector-prices/${editingTransportId}/?organization=${orgId}`,
          transportData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Transport sector updated successfully!");
      } else {
        // Create new
        await axios.post(
          `http://127.0.0.1:8000/api/transport-sector-prices/?organization=${orgId}`,
          transportData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Transport sector added successfully!");
      }
      fetchTransportSectors();
      resetTransportForm();
    } catch (error) {
      console.error("Error setting transport sector:", error);
      toast.error(
        "Failed to set transport sector: " +
        (error.response?.data?.detail || "Unknown error")
      );
    } finally {
      setIsSettingTransport(false);
    }
  };

  const handleTransportSelect = (e) => {
    const sectorId = e.target.value;
    setRemoveTransport(sectorId);

    if (sectorId) {
      // Find the selected sector
      const selectedSector = transportSectors.find(
        (sector) => sector.id.toString() === sectorId
      );
      if (selectedSector) {
        // Safely populate form fields with fallback values
        setTransportSector(selectedSector.name || "");
        setVehicleType(selectedSector.vehicle_type || "");
        setTransportAdult(selectedSector.adault_price?.toString() || "");
        setTransportChild(selectedSector.child_price?.toString() || "");
        setTransportInfants(selectedSector.infant_price?.toString() || "");
        setWithVisa(selectedSector.is_visa || false);
        setEditingTransportId(selectedSector.id);
      }
    } else {
      // Reset form if "Select Sector" is chosen
      resetTransportForm();
    }
  };

  const handleDeleteTransportSector = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!removeTransport) {
      toast.warning("Please select a sector to remove");
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/transport-sector-prices/${removeTransport}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Transport sector deleted successfully!");
      fetchTransportSectors();
      setRemoveTransport("");
      setShowDeleteTransportModal(false);
    } catch (error) {
      console.error("Error deleting transport sector:", error);
      toast.error("Failed to delete transport sector");
    }
  };

  const resetTransportForm = () => {
    setTransportSector("");
    setTransportAdult("");
    setTransportChild("");
    setTransportInfants("");
    setVehicleType("");
    setWithVisa(false);
    setEditingTransportId(null);
  };

  useEffect(() => {
    fetchTransportSectors();
  }, []);

  // State for Visa Type Two
  const [visaTypeTwoData, setVisaTypeTwoData] = useState([]);
  const [editingVisaTypeTwoId, setEditingVisaTypeTwoId] = useState(null);
  const [isSettingVisaTypeTwo, setIsSettingVisaTypeTwo] = useState(false);
  const [isLoadingVisaTypeTwo, setIsLoadingVisaTypeTwo] = useState(false);

  // Input states
  const [visaTitle, setVisaTitle] = useState("");
  const [personFrom, setPersonFrom] = useState("");
  const [personTo, setPersonTo] = useState("");
  const [adultPrice, setAdultPrice] = useState("");
  const [childPrice, setChildPrice] = useState("");
  const [infantPrice, setInfantPrice] = useState("");
  const [withTransport, setWithTransport] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState([]);

  const [selectedVehicleTypeIds, setSelectedVehicleTypeIds] = useState([]);

  const fetchVehicleTypesForVisa = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/vehicle-types/?organization=${orgId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.results || data.data || [data];
      }

      setVehicleTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehicle types for visa:', error);
    }
  };

  // Update the Visa Type Two submit function to include vehicle types
  const handleVisaTypeTwoSubmit = async () => {
    const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    // Validate required fields
    if (!visaTitle || !personFrom || !personTo || !adultPrice || !childPrice || !infantPrice) {
      toast.warning("Please fill all required fields");
      return;
    }

    // Validate numeric fields
    if (isNaN(personFrom) || isNaN(personTo) || isNaN(adultPrice) || isNaN(childPrice) || isNaN(infantPrice)) {
      toast.warning("Please enter valid numbers for all price and person fields");
      return;
    }

    setIsSettingVisaTypeTwo(true);

    // Prepare hotel_details with valid hotels only
    const validHotelDetails = selectedHotelIds
      .filter((hotelId) => availableHotels.some((hotel) => hotel.id === hotelId))
      .map((hotelId) => ({ hotel: hotelId }));

    // Prepare vehicle_types array with valid vehicle type IDs only
    const validVehicleTypes = selectedVehicleTypeIds
      .filter((vehicleTypeId) => vehicleTypes.some((vt) => vt.id === vehicleTypeId))
      .map((vehicleTypeId) => vehicleTypeId);

    const visaTypeTwoPayload = {
      title: visaTitle,
      person_from: parseInt(personFrom),
      person_to: parseInt(personTo),
      adault_price: parseFloat(adultPrice),
      child_price: parseFloat(childPrice),
      infant_price: parseFloat(infantPrice),
      is_transport: withTransport,
      hotel_details: validHotelDetails.length > 0 ? validHotelDetails : [],
      vehicle_types: validVehicleTypes, // Add vehicle types to payload
      organization: orgId,
    };

    try {
      if (editingVisaTypeTwoId) {
        // Verify the visa exists by trying to fetch it first
        try {
          await axios.get(
            `http://127.0.0.1:8000/api/umrah-visa-type-two/${editingVisaTypeTwoId}/?organization=${orgId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (error) {
          throw new Error("Visa not found or you don't have permission to edit it");
        }

        // Update existing
        await axios.put(
          `http://127.0.0.1:8000/api/umrah-visa-type-two/${editingVisaTypeTwoId}/?organization=${orgId}`,
          visaTypeTwoPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa type two updated successfully!");
      } else {
        // Create new
        await axios.post(
          `http://127.0.0.1:8000/api/umrah-visa-type-two/?organization=${orgId}`,
          visaTypeTwoPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa type two added successfully!");
      }
      fetchVisaTypeTwoData();
      resetVisaTypeTwoForm();
    } catch (error) {
      console.error("Error setting visa type two:", error);
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to set visa type two"
      );
    } finally {
      setIsSettingVisaTypeTwo(false);
    }
  };

  // Update the reset function to clear vehicle types
  const resetVisaTypeTwoForm = () => {
    setVisaTitle("type2");
    setPersonFrom("1");
    setPersonTo("1");
    setAdultPrice("");
    setChildPrice("");
    setInfantPrice("");
    setWithTransport(false);
    setSelectedHotelIds([]);
    setSelectedVehicleTypeIds([]); // Clear vehicle types
    setEditingVisaTypeTwoId(null);
  };

  // Update the edit function to populate vehicle types
  const handleVisaSelectChange = (e) => {
    const visaId = e.target.value;
    setEditingVisaTypeTwoId(visaId || null);

    if (visaId) {
      const selectedVisa = visaTypeTwoData.find(
        (v) => v.id.toString() === visaId
      );
      if (selectedVisa) {
        setVisaTitle(selectedVisa.title || "type2");
        setPersonFrom(selectedVisa.person_from?.toString() || "1");
        setPersonTo(selectedVisa.person_to?.toString() || "1");
        setAdultPrice(selectedVisa.adault_price?.toString() || "");
        setChildPrice(selectedVisa.child_price?.toString() || "");
        setInfantPrice(selectedVisa.infant_price?.toString() || "");
        setWithTransport(selectedVisa.is_transport || false);

        // Filter out any invalid hotel IDs
        const validHotelIds = selectedVisa.hotel_details
          ?.map((h) => h.hotel)
          .filter((hotelId) => availableHotels.some((h) => h.id === hotelId)) || [];

        setSelectedHotelIds(validHotelIds);

        // Populate vehicle types from the API response
        const validVehicleTypeIds = selectedVisa.vehicle_types
          ?.filter((vtId) => vehicleTypes.some((vt) => vt.id === vtId)) || [];

        setSelectedVehicleTypeIds(validVehicleTypeIds);
      }
    } else {
      resetVisaTypeTwoForm();
    }
  };

  // Function to toggle vehicle type selection
  const toggleVehicleTypeSelection = (vehicleTypeId) => {
    setSelectedVehicleTypeIds((prev) =>
      prev.includes(vehicleTypeId)
        ? prev.filter((id) => id !== vehicleTypeId)
        : [...prev, vehicleTypeId]
    );
  };

  // Function to handle vehicle type modal
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);

  const handleShowVehicleTypes = async () => {
    await fetchVehicleTypesForVisa();
    setShowVehicleTypeModal(true);
  };

  const handleCloseVehicleTypes = () => setShowVehicleTypeModal(false);

  const handleSaveVehicleTypes = () => {
    handleCloseVehicleTypes();
  };

  // Add to useEffect to fetch vehicle types on component mount
  useEffect(() => {
    fetchVisaTypeTwoData();
    fetchHotels();
    fetchVehicleTypesForVisa(); // Fetch vehicle types when component mounts
  }, []);

  const fetchVisaTypeTwoData = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setIsLoadingVisaTypeTwo(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/umrah-visa-type-two/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const visaData = Array.isArray(response.data) ? response.data : [];
      setVisaTypeTwoData(visaData);

      // You might want to populate form if editing existing entry
    } catch (error) {
      console.error("Error fetching visa type two data:", error);
      toast.error("Failed to fetch visa type two data");
    } finally {
      setIsLoadingVisaTypeTwo(false);
    }
  };

  // const handleVisaTypeTwoSubmit = async () => {
  //   const orgId =
  //     typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

  //   // Validate required fields
  //   if (
  //     !visaTitle ||
  //     !personFrom ||
  //     !personTo ||
  //     !adultPrice ||
  //     !childPrice ||
  //     !infantPrice
  //   ) {
  //     toast.warning("Please fill all required fields");
  //     return;
  //   }

  //   // Validate numeric fields
  //   if (
  //     isNaN(personFrom) ||
  //     isNaN(personTo) ||
  //     isNaN(adultPrice) ||
  //     isNaN(childPrice) ||
  //     isNaN(infantPrice)
  //   ) {
  //     toast.warning(
  //       "Please enter valid numbers for all price and person fields"
  //     );
  //     return;
  //   }

  //   setIsSettingVisaTypeTwo(true);

  //   // Prepare hotel_details with valid hotels only
  //   const validHotelDetails = selectedHotelIds
  //     .filter((hotelId) =>
  //       availableHotels.some((hotel) => hotel.id === hotelId)
  //     )
  //     .map((hotelId) => ({ hotel: hotelId }));

  //   const visaTypeTwoPayload = {
  //     title: visaTitle,
  //     person_from: parseInt(personFrom),
  //     person_to: parseInt(personTo),
  //     adault_price: parseFloat(adultPrice),
  //     child_price: parseFloat(childPrice),
  //     infant_price: parseFloat(infantPrice),
  //     is_transport: withTransport,
  //     hotel_details: validHotelDetails.length > 0 ? validHotelDetails : [],
  //     organization: orgId,
  //   };

  //   try {
  //     if (editingVisaTypeTwoId) {
  //       // Verify the visa exists by trying to fetch it first
  //       try {
  //         await axios.get(
  //           `http://127.0.0.1:8000/api/umrah-visa-type-two/${editingVisaTypeTwoId}/?organization=${orgId}`,
  //           {
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //             },
  //           }
  //         );
  //       } catch (error) {
  //         throw new Error(
  //           "Visa not found or you don't have permission to edit it"
  //         );
  //       }

  //       // Update existing
  //       await axios.put(
  //         `http://127.0.0.1:8000/api/umrah-visa-type-two/${editingVisaTypeTwoId}/?organization=${orgId}`,
  //         visaTypeTwoPayload,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );
  //       toast.success("Visa type two updated successfully!");
  //     } else {
  //       // Create new
  //       await axios.post(
  //         `http://127.0.0.1:8000/api/umrah-visa-type-two/?organization=${orgId}`,
  //         visaTypeTwoPayload,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );
  //       toast.success("Visa type two added successfully!");
  //     }
  //     fetchVisaTypeTwoData();
  //     resetVisaTypeTwoForm();
  //   } catch (error) {
  //     console.error("Error setting visa type two:", error);
  //     toast.error(
  //       error.response?.data?.detail ||
  //       error.response?.data?.message ||
  //       error.message ||
  //       "Failed to set visa type two"
  //     );
  //   } finally {
  //     setIsSettingVisaTypeTwo(false);
  //   }
  // };

  const [availableHotels, setAvailableHotels] = useState([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState([]);
  const fetchHotels = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/hotels/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAvailableHotels(response.data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Failed to load hotels");
    }
  };

  const [showHotelModal, setShowHotelModal] = useState(false);

  const handleShowHotels = async () => {
    await fetchHotels();
    setShowHotelModal(true);
  };

  useEffect(() => {
    fetchVisaTypeTwoData();
    fetchHotels();
  }, []);

  const handleCloseHotels = () => setShowHotelModal(false);

  const toggleHotelSelection = (hotelId) => {
    // Verify the hotel exists
    if (availableHotels.some((hotel) => hotel.id === hotelId)) {
      setSelectedHotelIds((prev) =>
        prev.includes(hotelId)
          ? prev.filter((id) => id !== hotelId)
          : [...prev, hotelId]
      );
    }
  };

  const handleSaveHotels = () => {
    handleCloseHotels();
  };

  // const handleVisaSelectChange = (e) => {
  //   const visaId = e.target.value;
  //   setEditingVisaTypeTwoId(visaId || null);

  //   if (visaId) {
  //     const selectedVisa = visaTypeTwoData.find(
  //       (v) => v.id.toString() === visaId
  //     );
  //     if (selectedVisa) {
  //       setVisaTitle(selectedVisa.title || "type2");
  //       setPersonFrom(selectedVisa.person_from?.toString() || "1");
  //       setPersonTo(selectedVisa.person_to?.toString() || "1");
  //       setAdultPrice(selectedVisa.adault_price?.toString() || "");
  //       setChildPrice(selectedVisa.child_price?.toString() || "");
  //       setInfantPrice(selectedVisa.infant_price?.toString() || "");
  //       setWithTransport(selectedVisa.is_transport || false);

  //       // Filter out any invalid hotel IDs
  //       const validHotelIds =
  //         selectedVisa.hotel_details
  //           ?.map((h) => h.hotel)
  //           .filter((hotelId) =>
  //             availableHotels.some((h) => h.id === hotelId)
  //           ) || [];

  //       setSelectedHotelIds(validHotelIds);
  //     }
  //   } else {
  //     resetVisaTypeTwoForm();
  //   }
  // };

  // const resetVisaTypeTwoForm = () => {
  //   setVisaTitle("type2");
  //   setPersonFrom("1");
  //   setPersonTo("1");
  //   setAdultPrice("");
  //   setChildPrice("");
  //   setInfantPrice("");
  //   setWithTransport(false);
  //   setSelectedHotelIds([]);
  //   setEditingVisaTypeTwoId(null);
  // };

  const handleDeleteVisa = async () => {
    if (!editingVisaTypeTwoId) {
      toast.warning("Please select a visa to remove");
      return;
    }

    try {
      const orgId =
        typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
      await axios.delete(
        `http://127.0.0.1:8000/api/umrah-visa-type-two/${editingVisaTypeTwoId}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Visa deleted successfully!");
      fetchVisaTypeTwoData();
      resetVisaTypeTwoForm();
      setShowDeleteVisaModal(false);
    } catch (error) {
      console.error("Error deleting visa:", error);
      toast.error(
        "Failed to delete visa: " +
        (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  //type 2 trnsport

  // State variables for Transport Type2
  const [transportType2Sectors, setTransportType2Sectors] = useState([]);
  const [editingTransportType2Id, setEditingTransportType2Id] = useState(null);
  const [isSettingTransportType2, setIsSettingTransportType2] = useState(false);
  const [isLoadingTransportType2, setIsLoadingTransportType2] = useState(false);

  // Input states for Transport Type2
  const [transportType2Sector, setTransportType2Sector] = useState("");
  const [transportType2Adult, setTransportType2Adult] = useState("");
  const [transportType2Child, setTransportType2Child] = useState("");
  const [transportType2Infants, setTransportType2Infants] = useState("");
  const [transportType2VehicleType, setTransportType2VehicleType] =
    useState("");
  const [removeTransportType2, setRemoveTransportType2] = useState("");
  const [onlyTransportCharges, setOnlyTransportCharges] = useState("");

  // Fetch Transport Type2 sectors
  const fetchTransportType2Sectors = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    setIsLoadingTransportType2(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/transport-sector-prices/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Filter for type2 sectors only
      const type2Sectors = Array.isArray(response.data)
        ? response.data.filter((sector) => sector.reference === "type2")
        : [];

      setTransportType2Sectors(type2Sectors);
    } catch (error) {
      console.error("Error fetching Transport Type2 sectors:", error);
      toast.error("Failed to fetch Transport Type2 sectors");
    } finally {
      setIsLoadingTransportType2(false);
    }
  };

  // Handle Transport Type2 selection
  const handleTransportType2Select = (e) => {
    const sectorId = e.target.value;
    setRemoveTransportType2(sectorId);

    if (sectorId && sectorId !== "All Sectors") {
      const selectedSector = transportType2Sectors.find(
        (sector) => sector.id.toString() === sectorId
      );
      if (selectedSector) {
        setTransportType2Sector(selectedSector.name || "");
        setTransportType2VehicleType(selectedSector.vehicle_type || "");
        setTransportType2Adult(selectedSector.adault_price?.toString() || "");
        setTransportType2Child(selectedSector.child_price?.toString() || "");
        setTransportType2Infants(selectedSector.infant_price?.toString() || "");
        setWithVisa(selectedSector.is_visa || false);
        setOnlyTransportCharges(selectedSector.only_transport_charge || false);
        setEditingTransportType2Id(selectedSector.id);
      }
    } else {
      resetTransportType2Form();
    }
  };

  // Handle Transport Type2 submit
  const handleTransportType2Submit = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (
      !transportType2Sector ||
      !transportType2Adult ||
      !transportType2Child ||
      !transportType2Infants ||
      !transportType2VehicleType
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    setIsSettingTransportType2(true);

    const transportType2Data = {
      reference: "type2",
      name: transportType2Sector,
      vehicle_type: transportType2VehicleType,
      adault_price: parseFloat(transportType2Adult),
      child_price: parseFloat(transportType2Child),
      infant_price: parseFloat(transportType2Infants),
      is_visa: false,
      only_transport_charge: onlyTransportCharges,
      organization: orgId,
    };

    try {
      if (editingTransportType2Id) {
        await axios.put(
          `http://127.0.0.1:8000/api/transport-sector-prices/${editingTransportType2Id}/?organization=${orgId}`,
          transportType2Data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Transport Type2 sector updated successfully!");
      } else {
        await axios.post(
          `http://127.0.0.1:8000/api/transport-sector-prices/?organization=${orgId}`,
          transportType2Data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Transport Type2 sector added successfully!");
      }
      fetchTransportType2Sectors();
      resetTransportType2Form();
    } catch (error) {
      console.error("Error setting Transport Type2 sector:", error);
      toast.error("Failed to set Transport Type2 sector");
    } finally {
      setIsSettingTransportType2(false);
    }
  };

  // Handle Transport Type2 delete
  const handleDeleteTransportType2 = async () => {
    if (!removeTransportType2 || removeTransportType2 === "All Sectors") {
      toast.warning("Please select a sector to remove");
      return;
    }

    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/transport-sector-prices/${removeTransportType2}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Transport Type2 sector removed successfully!");
      fetchTransportType2Sectors();
      resetTransportType2Form();
      setShowDeleteTransportType2Modal(false);
    } catch (error) {
      console.error("Error deleting Transport Type2 sector:", error);
      toast.error("Failed to delete Transport Type2 sector");
    }
  };

  // Reset Transport Type2 form
  const resetTransportType2Form = () => {
    setTransportType2Sector("");
    setTransportType2VehicleType("");
    setTransportType2Adult("");
    setTransportType2Child("");
    setTransportType2Infants("");
    setEditingTransportType2Id(null);
    setRemoveTransportType2("");
  };

  // Fetch on mount
  useEffect(() => {
    fetchTransportType2Sectors();
  }, []);

  //Only Visa Rates
  const [onlyVisaPrices, setOnlyVisaPrices] = useState([]);
  const [isSettingOnlyVisa, setIsSettingOnlyVisa] = useState(false);
  const [isLoadingOnlyVisa, setIsLoadingOnlyVisa] = useState(false);

  // Input states
  const [onlyVisaAdult, setOnlyVisaAdult] = useState("");
  const [onlyVisaChild, setOnlyVisaChild] = useState("");
  const [onlyVisaInfant, setOnlyVisaInfant] = useState("");
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");
  const [airportId, setAirportId] = useState("");
  const [airport, setAirport] = useState("");
  const [status, setStatus] = useState("");

  const [selectedVisaPrice, setSelectedVisaPrice] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSetOnlyVisaPrices = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    // Validate all required fields with specific error messages
    const validationErrors = [];
    if (!onlyVisaAdult) validationErrors.push("Adult price");
    if (!onlyVisaChild) validationErrors.push("Child price");
    if (!onlyVisaInfant) validationErrors.push("Infant price");
    if (!minDays) validationErrors.push("Minimum days");
    if (!maxDays) validationErrors.push("Maximum days");
    if (!airportId) validationErrors.push("Airport");

    if (validationErrors.length > 0) {
      toast.error(`Please fill: ${validationErrors.join(", ")}`);
      return;
    }

    setIsSettingOnlyVisa(true);

    const visaPriceData = {
      adault_price: parseFloat(onlyVisaAdult),
      child_price: parseFloat(onlyVisaChild),
      infant_price: parseFloat(onlyVisaInfant),
      min_days: minDays.toString(),
      max_days: maxDays.toString(),
      city_id: parseInt(airportId),
      type: "type2",
      organization: orgId,
      status: status
    };

    try {
      let response;
      if (selectedVisaPrice) {
        // Check if selectedVisaPrice exists first
        // Update existing visa price
        response = await axios.put(
          `http://127.0.0.1:8000/api/only-visa-prices/${selectedVisaPrice.id}/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa price updated successfully!");
      } else {
        // Create new visa price
        response = await axios.post(
          `http://127.0.0.1:8000/api/only-visa-prices/?organization=${orgId}`,
          visaPriceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Visa price created successfully!");
      }

      await fetchOnlyVisaPrices();
      resetFormFields();
    } catch (error) {
      console.error("Error saving visa price:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to save visa price";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSettingOnlyVisa(false);
    }
  };

  // Helper function to reset form
  const resetFormFields = () => {
    setOnlyVisaAdult("");
    setOnlyVisaChild("");
    setOnlyVisaInfant("");
    setMinDays("");
    setMaxDays("");
    setAirportId("");
    setAirport("");
    setStatus(""); // Reset to active
    setSelectedVisaPrice(null);
  };
  // Delete function
  const handleDeleteVisaPrice = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!selectedVisaPrice) {
      // Changed this condition
      toast.warning("Please select a visa price to delete");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this visa price?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/only-visa-prices/${selectedVisaPrice.id}/?organization=${orgId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Visa price deleted successfully");
      fetchOnlyVisaPrices();
      resetFormFields();
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Failed to delete visa price";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchOnlyVisaPrices = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/only-visa-prices/?organization=${orgId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // console.log("API Response:", response.data);
      setOnlyVisaPrices(response.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    if (selectedOrg) {
      fetchOnlyVisaPrices();
    }
  }, [selectedOrg]);

  const [formData, setFormData] = useState({
    title: "",
    min_pex: "",
    per_pex: "",
    active: true,
    organization: selectedOrg?.id || 0,
  });

  // State for food prices list
  // const [title, setTitle] = useState('');
  // const [minPex, setMinPex] = useState('');
  // const [perPex, setPerPex] = useState('');
  // const [active, setActive] = useState(true);
  // const [organization, setOrganization] = useState(0);



  //vehicle type
  const [vehicleTypeName, setVehicleTypeName] = useState('');
  const [vehicleTypeType, setVehicleTypeType] = useState('');
  const [vehicleTypePrice, setVehicleTypePrice] = useState('');
  const [vehicleTypeNote, setVehicleTypeNote] = useState('');
  const [vehicleTypeVisaType, setVehicleTypeVisaType] = useState('type2');
  const [vehicleTypeStatus, setVehicleTypeStatus] = useState('active');
  const [vehicleTypeSectorId, setVehicleTypeSectorId] = useState(0); // Single sector ID
  const [vehicleTypeSectorType, setVehicleTypeSectorType] = useState(''); // 'small' or 'big' - auto detect

  // Combined sectors list
  const [allSectors, setAllSectors] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState('');
  const [editingVehicleTypeId, setEditingVehicleTypeId] = useState(null);
  const [isSubmittingVehicleType, setIsSubmittingVehicleType] = useState(false);
  const [showDeleteVehicleTypeModal, setShowDeleteVehicleTypeModal] = useState(false);

  // Fetch all sectors (both small and big)

  // Helper function to get city name by ID with code
  const getCityNameWithCode = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? ` (${city.code})` : `City ${cityId}`;
  };

  // Helper function to display small sector with city codes
  // const getSectorDisplayName = (sector) => {
  //   const departureCity = getCityNameWithCode(sector.departure_city);
  //   const arrivalCity = getCityNameWithCode(sector.arrival_city);
  //   return `${departureCity} → ${arrivalCity}`;
  // };

  // Helper function to display big sector with chain of city codes
  const getBigSectorDisplayName = (bigSector) => {
    if (!bigSector.small_sectors || bigSector.small_sectors.length === 0) {
      return "No sectors";
    }

    const sortedSectors = optimizeSectorChain(bigSector.small_sectors);
    if (sortedSectors.length === 0) return "Invalid chain";

    const cityCodes = [];

    sortedSectors.forEach((sector, index) => {
      const departureCity = getCityNameWithCode(sector.departure_city);
      const arrivalCity = getCityNameWithCode(sector.arrival_city);

      const departureCode = departureCity.split('(')[1]?.replace(')', '') || 'UNK';
      const arrivalCode = arrivalCity.split('(')[1]?.replace(')', '') || 'UNK';

      if (index === 0) {
        cityCodes.push(departureCode);
      }
      cityCodes.push(arrivalCode);
    });

    // Remove consecutive duplicates and join
    const finalCodes = cityCodes.filter((code, index, array) =>
      index === 0 || code !== array[index - 1]
    );

    return finalCodes.join('-');
  };

  // Fetch vehicle types with proper sector data
  // const fetchVehicleTypes = async () => {
  //   try {
  //     const response = await axios.get(`http://127.0.0.1:8000/api/vehicle-types/?organization=${orgId}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     const data = response.data;
  //     setVehicleTypes(Array.isArray(data) ? data : []);
  //   } catch (error) {
  //     console.error('Error fetching vehicle types:', error);
  //     toast.error('Failed to fetch vehicle types');
  //   }
  // };

  const handleVehicleTypeSubmit = async () => {
    if (!vehicleTypeName || !vehicleTypeType || !vehicleTypePrice) {
      toast.warning('Please fill all required fields');
      return;
    }

    // Validate that a sector is selected and it's either small or big
    if (!vehicleTypeSectorId || vehicleTypeSectorId === 0) {
      toast.warning('Please select a sector');
      return;
    }

    // Determine if it's a small or big sector
    const isSmallSector = smallSectors.some(sector => sector.id === parseInt(vehicleTypeSectorId));
    const isBigSector = bigSectors.some(sector => sector.id === parseInt(vehicleTypeSectorId));

    if (!isSmallSector && !isBigSector) {
      toast.error('Selected sector not found. Please select a valid sector.');
      return;
    }

    setIsSubmittingVehicleType(true);

    // Construct payload based on sector type - use the correct field names for API
    const payload = {
      vehicle_name: vehicleTypeName,
      vehicle_type: vehicleTypeType,
      price: parseFloat(vehicleTypePrice),
      note: vehicleTypeNote,
      visa_type: "type2",
      status: vehicleTypeStatus,
      organization: parseInt(orgId),
      // Only include one sector field based on selection
      ...(isSmallSector && { small_sector_id: parseInt(vehicleTypeSectorId) }),
      ...(isBigSector && { big_sector_id: parseInt(vehicleTypeSectorId) })
    };

    // Ensure only one sector field is sent (remove the other)
    if (isSmallSector) {
      delete payload.big_sector_id;
    }
    if (isBigSector) {
      delete payload.small_sector_id;
    }

    try {
      if (editingVehicleTypeId) {
        // Update existing vehicle type
        await axios.put(
          `http://127.0.0.1:8000/api/vehicle-types/${editingVehicleTypeId}/?organization=${orgId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Vehicle type updated successfully!");
      } else {
        // Create new vehicle type
        await axios.post(
          `http://127.0.0.1:8000/api/vehicle-types/?organization=${orgId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Vehicle type added successfully!");
      }

      resetVehicleTypeForm();
      fetchVehicleTypes();
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      toast.error('Failed to save vehicle type: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmittingVehicleType(false);
    }
  };

  // ✅ Enhanced fetchVehicleTypes to handle API response structure
  const fetchVehicleTypes = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/vehicle-types/?organization=${orgId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle both array and object response structures
      let data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // If it's an object with results property or similar
        data = data.results || data.data || [data];
      }

      setVehicleTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      toast.error('Failed to fetch vehicle types');
    }
  };

  // ✅ Enhanced handleVehicleTypeSelect to properly set sector based on API response
  const handleVehicleTypeSelect = (e) => {
    const vehicleTypeId = e.target.value;
    setSelectedVehicleTypeId(vehicleTypeId);

    if (vehicleTypeId) {
      const selectedVehicleType = vehicleTypes.find(v => v.id === parseInt(vehicleTypeId));
      if (selectedVehicleType) {
        setEditingVehicleTypeId(selectedVehicleType.id);
        setVehicleTypeName(selectedVehicleType.vehicle_name);
        setVehicleTypeType(selectedVehicleType.vehicle_type);
        setVehicleTypePrice(selectedVehicleType.price?.toString() || '');
        setVehicleTypeNote(selectedVehicleType.note || '');
        setVehicleTypeVisaType(selectedVehicleType.visa_type || 'type2');
        setVehicleTypeStatus(selectedVehicleType.status || 'active');

        // Determine which sector is set and populate the sector ID
        if (selectedVehicleType.small_sector && selectedVehicleType.small_sector.id) {
          setVehicleTypeSectorId(selectedVehicleType.small_sector.id);
        } else if (selectedVehicleType.big_sector && selectedVehicleType.big_sector.id) {
          setVehicleTypeSectorId(selectedVehicleType.big_sector.id);
        } else if (selectedVehicleType.small_sector_id) {
          setVehicleTypeSectorId(selectedVehicleType.small_sector_id);
        } else if (selectedVehicleType.big_sector_id) {
          setVehicleTypeSectorId(selectedVehicleType.big_sector_id);
        } else {
          setVehicleTypeSectorId(0);
        }
      }
    } else {
      resetVehicleTypeForm();
    }
  };

  // ✅ Enhanced delete function
  const handleVehicleTypeDelete = async () => {
    if (!selectedVehicleTypeId) {
      toast.warning('Please select a vehicle type to delete');
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/vehicle-types/${selectedVehicleTypeId}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Vehicle type deleted successfully!');
      setShowDeleteVehicleTypeModal(false);
      resetVehicleTypeForm();
      fetchVehicleTypes();
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      toast.error('Failed to delete vehicle type: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ✅ Enhanced UI with better sector display and validation
  const getSectorDisplayName = (sectorId) => {
    // Check if it's a small sector
    const smallSector = smallSectors.find(s => s.id === parseInt(sectorId));
    if (smallSector) {
      const departureCity = getCityNameWithCode(smallSector.departure_city);
      const arrivalCity = getCityNameWithCode(smallSector.arrival_city);
      return `Small: ${departureCity} → ${arrivalCity}`;
    }

    // Check if it's a big sector
    const bigSector = bigSectors.find(b => b.id === parseInt(sectorId));
    if (bigSector) {
      return `Big: ${getBigSectorDisplayName(bigSector)}`;
    }

    return `Sector #${sectorId}`;
  };

  // Call all fetch functions in useEffect
  useEffect(() => {
    fetchSmallSectors();
    fetchBigSectors();
    fetchCities();
    fetchVehicleTypes();
  }, []);

  // const fetchAllSectors = async () => {
  //   try {
  //     // Fetch small sectors using axios
  //     const smallResponse = await axios.get(`http://127.0.0.1:8000/api/sectors/?organization=${orgId}`);
  //     const smallData = smallResponse.data;
  //     const smallSectors = (smallData.results || smallData).map(sector => ({
  //       ...sector,
  //       sector_type: 'small',
  //       display_name: `Small: ${sector.name || sector.sector_name || `Sector ${sector.id}`}`
  //     }));

  //     // Fetch big sectors using axios
  //     const bigResponse = await axios.get(`http://127.0.0.1:8000/api/big-sectors/?organization=${orgId}`);
  //     const bigData = bigResponse.data;
  //     const bigSectors = (bigData.results || bigData).map(sector => ({
  //       ...sector,
  //       sector_type: 'big',
  //       display_name: `Big: ${sector.name || sector.sector_name || `Sector ${sector.id}`}`
  //     }));

  //     // Combine both lists
  //     setAllSectors([...smallSectors, ...bigSectors]);
  //   } catch (error) {
  //     console.error('Error fetching sectors:', error);
  //   }
  // };

  // Fetch vehicle types with axios
  // const fetchVehicleTypes = async () => {
  //   try {
  //     const response = await axios.get(`http://127.0.0.1:8000/api/vehicle-types/?organization=${orgId}`);
  //     const data = response.data;
  //     setVehicleTypes(data.results || data);
  //   } catch (error) {
  //     console.error('Error fetching vehicle types:', error);
  //   }
  // };

  useEffect(() => {
    // fetchAllSectors();
    fetchVehicleTypes();
  }, []);

  // Reset vehicle type form
  const resetVehicleTypeForm = () => {
    setVehicleTypeName('');
    setVehicleTypeType('');
    setVehicleTypePrice('');
    setVehicleTypeNote('');
    setVehicleTypeVisaType('type2');
    setVehicleTypeStatus('active');
    setVehicleTypeSectorId(0);
    setVehicleTypeSectorType('');
    setEditingVehicleTypeId(null);
    setSelectedVehicleTypeId('');
  };

  // Data state
  const [foodFormData, setFoodFormData] = useState({
    title: "",
    min_pex: "",
    per_pex: "",
    active: true,
    organization: "",
    city_id: "",
    description: "",
    price: ""
  });

  const [foodCities, setFoodCities] = useState([]);
  const [foodPrices, setFoodPrices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentId, setCurrentId] = useState(null);

  const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

  // API base URLs
  const FOOD_PRICES_API_URL = `http://127.0.0.1:8000/api/food-prices/?organization=${orgId}`;
  const CITIES_API_URL = `http://127.0.0.1:8000/api/cities/?organization=${orgId}`;

  // Fetch food prices and cities on component mount
  useEffect(() => {
    fetchFoodPrices();
    foodFetchCities();
  }, []);

  const fetchFoodPrices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(FOOD_PRICES_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFoodPrices(response.data);
      // console.log(response.data);
    } catch (err) {
      setError("Failed to fetch food prices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const foodFetchCities = async () => {
    try {
      const response = await axios.get(CITIES_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFoodCities(response.data);
    } catch (err) {
      setError("Failed to fetch cities");
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFoodFormData({
      ...foodFormData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmitFood = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const dataToSend = {
        ...foodFormData,
        organization: parseInt(orgId),
        min_pex: parseInt(foodFormData.min_pex) || 0,
        per_pex: parseInt(foodFormData.per_pex) || 0,
        price: parseInt(foodFormData.price) || 0,
        city_id: parseInt(foodFormData.city_id) || 0,
        title: foodFormData.title.trim(),
        description: foodFormData.description.trim(),
        active: foodFormData.active,
      };

      if (isEditing && currentId) {
        // Update existing record
        await axios.put(
          `http://127.0.0.1:8000/api/food-prices/${currentId}/?organization=${orgId}`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Food price updated successfully!");
      } else {
        // Create new record
        await axios.post(FOOD_PRICES_API_URL, dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Food price added successfully!");
      }

      resetForm();
      fetchFoodPrices();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (foodPrice) => {
    setFoodFormData({
      title: foodPrice.title,
      min_pex: foodPrice.min_pex,
      per_pex: foodPrice.per_pex,
      active: foodPrice.active,
      organization: orgId,
      city_id: foodPrice.city?.id || "", // Fix: access city ID from nested object
      description: foodPrice.description || "",
      price: foodPrice.price || ""
    });
    setIsEditing(true);
    setCurrentId(foodPrice.id);
  };

  // Update resetForm function:
  const resetForm = () => {
    setFoodFormData({
      title: "",
      min_pex: "",
      per_pex: "",
      active: true,
      organization: orgId,
      city_id: "",
      description: "",
      price: ""
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this food price?")) {
      try {
        setLoading(true);
        await axios.delete(
          `http://127.0.0.1:8000/api/food-prices/${id}/?organization=${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Food price deleted successfully!");
        fetchFoodPrices();
        resetForm();
      } catch (err) {
        setError("Failed to delete food price");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Ziarat Prices State

  const [ziaratPrices, setZiaratPrices] = useState([]);
  const [editingZiaratId, setEditingZiaratId] = useState(null);
  const [isLoadingZiarat, setIsLoadingZiarat] = useState(false);
  const [isSavingZiarat, setIsSavingZiarat] = useState(false);
  const [ziaratCities, setZiaratCities] = useState([]);

  // Form fields - updated according to API structure
  const [ziaratFormData, setZiaratFormData] = useState({
    city_id: "",
    ziarat_title: "",
    description: "",
    contact_person: "",
    contact_number: "",
    price: "",
    status: "active",
    min_pex: "",
    max_pex: "",
    organization: ""
  });

  // Fetch all ziarat prices
  const fetchZiaratPrices = async () => {
    setIsLoadingZiarat(true);
    const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/ziarat-prices/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setZiaratPrices(response.data);
    } catch (error) {
      console.error("Error fetching ziarat prices:", error);
      toast.error("Failed to load ziarat prices");
    } finally {
      setIsLoadingZiarat(false);
    }
  };

  // Fetch cities for ziarat
  const fetchZiaratCities = async () => {
    const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/cities/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setZiaratCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities");
    }
  };

  // Handle input change
  const handleZiaratInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setZiaratFormData({
      ...ziaratFormData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Create or Update ziarat price
  const handleSaveZiarat = async () => {
    const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!ziaratFormData.ziarat_title || !ziaratFormData.contact_person || !ziaratFormData.contact_number || !ziaratFormData.price) {
      toast.warning("Please fill all required fields");
      return;
    }

    setIsSavingZiarat(true);

    const ziaratData = {
      city_id: parseInt(ziaratFormData.city_id) || 0,
      ziarat_title: ziaratFormData.ziarat_title.trim(),
      description: ziaratFormData.description.trim(),
      contact_person: ziaratFormData.contact_person.trim(),
      contact_number: ziaratFormData.contact_number.trim(),
      price: parseFloat(ziaratFormData.price) || 0,
      status: ziaratFormData.status,
      min_pex: parseInt(ziaratFormData.min_pex) || 0,
      max_pex: parseInt(ziaratFormData.max_pex) || 0,
      organization: parseInt(orgId),
    };

    try {
      if (editingZiaratId) {
        // Update existing
        await axios.put(
          `http://127.0.0.1:8000/api/ziarat-prices/${editingZiaratId}/?organization=${orgId}`,
          ziaratData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Ziarat price updated successfully!");
      } else {
        // Create new
        await axios.post(
          `http://127.0.0.1:8000/api/ziarat-prices/?organization=${orgId}`,
          ziaratData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Ziarat price added successfully!");
      }
      fetchZiaratPrices();
      resetZiaratForm();
    } catch (error) {
      console.error("Error saving ziarat price:", error);
      toast.error("Failed to save ziarat price");
    } finally {
      setIsSavingZiarat(false);
    }
  };

  // Delete ziarat price
  const handleDeleteZiarat = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ziarat price?")) {
      return;
    }

    const orgId = typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/ziarat-prices/${id}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Ziarat price deleted successfully!");
      fetchZiaratPrices();
      if (editingZiaratId === id) {
        resetZiaratForm();
      }
    } catch (error) {
      console.error("Error deleting ziarat price:", error);
      toast.error("Failed to delete ziarat price");
    }
  };

  // Reset form
  const resetZiaratForm = () => {
    setZiaratFormData({
      city_id: "",
      ziarat_title: "",
      description: "",
      contact_person: "",
      contact_number: "",
      price: "",
      status: "active",
      min_pex: "",
      max_pex: "",
      organization: ""
    });
    setEditingZiaratId(null);
  };

  // Handle edit selection
  const handleEditZiarat = (ziarat) => {
    setZiaratFormData({
      city_id: ziarat.city?.id || "", // Fix: access city ID from nested object
      ziarat_title: ziarat.ziarat_title || "",
      description: ziarat.description || "",
      contact_person: ziarat.contact_person || "",
      contact_number: ziarat.contact_number || "",
      price: ziarat.price ? ziarat.price.toString() : "",
      status: ziarat.status || "active",
      min_pex: ziarat.min_pex ? ziarat.min_pex.toString() : "",
      max_pex: ziarat.max_pex ? ziarat.max_pex.toString() : "",
      organization: ziarat.organization || ""
    });
    setEditingZiaratId(ziarat.id);
  };

  useEffect(() => {
    fetchZiaratPrices();
    fetchZiaratCities();
  }, []);

  // Section 9: City details
  const [cityName, setCityName] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [removeCity, setRemoveCity] = useState("");

  // Section 10: Booking expire time
  const [groupExpiry, setGroupExpiry] = useState("");
  const [umrahExpiry, setUmrahExpiry] = useState("");
  const [removeExpirySetting, setRemoveExpirySetting] = useState("");

  const [showModal, setShowModal] = useState(false);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  // Toggle selection
  const toggleHotel = (hotel) => {
    setSelectedHotels((prevSelected) =>
      prevSelected.includes(hotel)
        ? prevSelected.filter((h) => h !== hotel)
        : [...prevSelected, hotel]
    );
  };

  const handleSubmit = () => {
    handleClose();
  };

  // Section 8: Flight details
  const [flightName, setFlightName] = useState("");
  const [flightCode, setFlightCode] = useState("");
  const [flightLogo, setFlightLogo] = useState(null);
  const [removeFlight, setRemoveFlight] = useState("");
  const [flights, setFlights] = useState([]);

  // Load all flights on mount
  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/airlines/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFlights(response.data);
    } catch (error) {
      console.error(
        "Error fetching flights:",
        error.response ? error.response.data : error
      );
      toast.error(
        "Failed to load flights: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFlightLogo(file);
    }
  };

  const handleAddFlight = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
    if (!flightName || !flightCode || !flightLogo) {
      toast.warning("Please provide all flight details.");
      return;
    }

    setIsAddingFlight(true);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("name", flightName);
    formData.append("code", flightCode);
    formData.append("organization", orgId);

    // If flightLogo is a base64 string, convert it to a Blob
    if (typeof flightLogo === "string" && flightLogo.startsWith("data:")) {
      const blob = await fetch(flightLogo).then((r) => r.blob());
      formData.append("logo", blob, "logo.png");
    } else if (flightLogo instanceof File) {
      formData.append("logo", flightLogo);
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/airlines/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Flight added:", response.data);
      toast.success("Flight added successfully!");
      fetchFlights(); // reload the list
      setFlightName("");
      setFlightCode("");
      setFlightLogo(null);
    } catch (error) {
      console.error(
        "Error adding flight:",
        error.response ? error.response.data : error
      );
      toast.error(
        "Failed to add flight: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsAddingFlight(false);
    }
  };

  const handleDeleteFlight = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/airlines/${removeFlight}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Flight deleted successfully!");
      fetchFlights();
      setRemoveFlight("");
      setShowDeleteFlightModal(false);
    } catch (error) {
      console.error("Error deleting flight:", error.response?.data || error);
      toast.error("Failed to delete flight.");
    }
  };

  const handleUpdateFlight = async () => {
    if (!editingFlightId) return;

    setIsAddingFlight(true);
    try {
      const orgId =
        typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
      const formData = new FormData();
      formData.append("name", flightName);
      formData.append("code", flightCode);
      formData.append("organization", orgId);

      if (flightLogo) {
        if (typeof flightLogo === "string" && flightLogo.startsWith("data:")) {
          const blob = await fetch(flightLogo).then((r) => r.blob());
          formData.append("logo", blob, "logo.png");
        } else if (flightLogo instanceof File) {
          formData.append("logo", flightLogo);
        }
      }

      await axios.put(
        `http://127.0.0.1:8000/api/airlines/${editingFlightId}/?organization=${orgId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Flight updated successfully!");
      fetchFlights();
      setIsEditingFlight(false);
    } catch (error) {
      console.error("Error updating flight:", error);
      toast.error("Failed to update flight");
    } finally {
      setIsAddingFlight(false);
    }
  };

  const handleUpdateCity = async () => {
    if (!editingCityId) return;

    setIsAddingCity(true);
    try {
      const orgId =
        typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

      await axios.put(
        `http://127.0.0.1:8000/api/cities/${editingCityId}/?organization=${orgId}`,
        {
          name: cityName,
          code: cityCode,
          organization: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("City updated successfully!");
      fetchCities();
      setIsEditingCity(false);
    } catch (error) {
      console.error("Error updating city:", error);
      toast.error("Failed to update city");
    } finally {
      setIsAddingCity(false);
    }
  };

  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setIsLoadingCities(true);
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/cities/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error.response?.data || error);
      toast.error(
        "Failed to load cities: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleAddCity = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    if (!cityName || !cityCode) {
      toast.warning("Please provide both city name and code");
      return;
    }

    setIsAddingCity(true);

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/cities/",
        {
          name: cityName,
          code: cityCode,
          organization: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("City added successfully!");
      fetchCities(); // Refresh the list
      setCityName("");
      setCityCode("");
    } catch (error) {
      console.error("Error adding city:", error.response?.data || error);
      toast.error(
        "Failed to add city: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsAddingCity(false);
    }
  };

  const handleDeleteCity = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/cities/${removeCity}/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("City deleted successfully!");
      fetchCities(); // Refresh the list
      setRemoveCity(""); // Reset the remove city selection
      setShowDeleteCityModal(false);
    } catch (error) {
      console.error("Error deleting city:", error.response?.data || error);
      toast.error(
        "Failed to delete city: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    }
  };

  const [isSettingExpiry, setIsSettingExpiry] = useState(false);
  const [expiryId, setExpiryId] = useState(null); // Add state to track expiry record ID

  // Fetch existing expiry times on component mount
  useEffect(() => {
    const fetchExpiryTimes = async () => {
      const orgId =
        typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/booking-expiry/?organization=${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.length > 0) {
          const expiryData = response.data[0];
          setExpiryId(expiryData.id);
          setUmrahExpiry(expiryData.umrah_expiry_time?.toString() || "");
          setGroupExpiry(expiryData.ticket_expiry_time?.toString() || "");
        }
      } catch (error) {
        console.error("Error fetching expiry times:", error);
      }
    };

    fetchExpiryTimes();
  }, []);

  const handleSetExpiry = async () => {
    const orgId =
      typeof selectedOrg === "object" ? selectedOrg.id : selectedOrg;

    // Validate inputs
    if (!groupExpiry || !umrahExpiry) {
      toast.warning("Please enter both expiry times");
      return;
    }

    setIsSettingExpiry(true);

    try {
      const payload = {
        umrah_expiry_time: parseInt(umrahExpiry),
        ticket_expiry_time: parseInt(groupExpiry),
        organization: orgId,
      };

      if (expiryId) {
        // Update existing record
        await axios.put(
          `http://127.0.0.1:8000/api/booking-expiry/${expiryId}/?organization=${orgId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Expiry times updated successfully!");
      } else {
        // Create new record
        const response = await axios.post(
          "http://127.0.0.1:8000/api/booking-expiry/",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setExpiryId(response.data.id); // Store the new ID
        toast.success("Expiry times set successfully!");
      }
    } catch (error) {
      console.error(
        "Error setting expiry times:",
        error.response?.data || error
      );
      toast.error(
        "Failed to set expiry times: " +
        (error.response?.data?.detail || "Unknown error.")
      );
    } finally {
      setIsSettingExpiry(false);
    }
  };

  const [editingFlightId, setEditingFlightId] = useState(null);
  const [isEditingFlight, setIsEditingFlight] = useState(false);

  const [editingCityId, setEditingCityId] = useState(null);
  const [isEditingCity, setIsEditingCity] = useState(false);

  const [isEditingExpiry, setIsEditingExpiry] = useState(false);

  const [isEditingOnlyVisa, setIsEditingOnlyVisa] = useState(false);

  // Delete Confirmation Modals
  const DeleteShirkaModal = () => (
    <Modal
      show={showDeleteShirkaModal}
      onHide={() => setShowDeleteShirkaModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this shirka?</Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteShirkaModal(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleRemoveShirka}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const DeleteSectorModal = () => (
    <Modal
      show={showDeleteSectorModal}
      onHide={() => setShowDeleteSectorModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this Sector?</Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteSectorModal(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleRemoveSector}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const DeleteTransportModal = () => (
    <Modal
      show={showDeleteTransportModal}
      onHide={() => setShowDeleteTransportModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete this transport sector?
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteTransportModal(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDeleteTransportSector}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const DeleteTransportType2Modal = () => (
    <Modal
      show={showDeleteTransportType2Modal}
      onHide={() => setShowDeleteTransportType2Modal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete this transport type 2 sector?
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteTransportType2Modal(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDeleteTransportType2}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const DeleteVisaModal = () => (
    <Modal
      show={showDeleteVisaModal}
      onHide={() => setShowDeleteVisaModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this visa?</Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteVisaModal(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDeleteVisa}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const DeleteFlightModal = () => (
    <Modal
      show={showDeleteFlightModal}
      onHide={() => setShowDeleteFlightModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this flight?</Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteFlightModal(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDeleteFlight}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const DeleteCityModal = () => (
    <Modal
      show={showDeleteCityModal}
      onHide={() => setShowDeleteCityModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this city?</Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteCityModal(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDeleteCity}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <>
      {/* Your app content */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          {/* Sidebar */}
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
          {/* Main Content */}
          <div className="col-12 col-lg-10">
            <div className="container">
              <Header />
              <div className="px-3 mt-3 px-lg-4">
                {/* Navigation Tabs */}
                <div className="row ">
                  <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                    {/* Navigation Tabs */}
                    <nav className="nav flex-wrap gap-2">
                      {tabs.map((tab, index) => (
                        <NavLink
                          key={index}
                          to={tab.path}
                          className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Visa and others"
                            ? "text-primary fw-semibold"
                            : "text-muted"
                            }`}
                          style={{ backgroundColor: "transparent" }}
                        >
                          {tab.name}
                        </NavLink>
                      ))}
                    </nav>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 mb-3 mt-md-0">
                      <Link
                        to="/packages/add-packages"
                        className="btn text-white"
                        style={{ background: "#1B78CE" }}
                      >
                        Add Package
                      </Link>
                      <Link
                        to=""
                        className="btn text-white"
                        style={{ background: "#1B78CE" }}
                      >
                        Export Package
                      </Link>
                    </div>
                  </div>

                  <div className="border rounded-4">
                    {/* 1 */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h4 className="fw-bold mb-0">Set Riyal Rate</h4>
                        </div>
                        <div className="col-12 d-flex flex-wrap gap-3">
                          <div>
                            <label htmlFor="" className="Control-label">
                              Price
                            </label>
                            <input
                              type="number"
                              className="form-control rounded shadow-none px-1 py-2"
                              required
                              placeholder="Riyal Rate"
                              value={riyalSettings.rate}
                              onChange={handleRiyalRateChange}
                              disabled={!isEditingRiyalRate}
                            />
                          </div>

                          <div className="form-check d-flex align-items-center gap-2">
                            <input
                              className="form-check-input border border-black"
                              type="checkbox"
                              checked={riyalSettings.is_visa_pkr}
                              onChange={(e) =>
                                setRiyalSettings({
                                  ...riyalSettings,
                                  is_visa_pkr: e.target.checked,
                                })
                              }
                              id="visaRatesInPkr"
                              disabled={!isEditingRiyalRate}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="visaRatesInPkr"
                            >
                              Visa Rates In PKR
                            </label>
                          </div>

                          <div className="form-check d-flex align-items-center gap-2">
                            <input
                              className="form-check-input border border-black"
                              type="checkbox"
                              checked={riyalSettings.is_transport_pkr}
                              onChange={(e) =>
                                setRiyalSettings({
                                  ...riyalSettings,
                                  is_transport_pkr: e.target.checked,
                                })
                              }
                              id="transportRatesInPkr"
                              disabled={!isEditingRiyalRate}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="transportRatesInPkr"
                            >
                              Transport Rates In PKR
                            </label>
                          </div>

                          <div className="form-check d-flex align-items-center gap-2">
                            <input
                              className="form-check-input border border-black"
                              type="checkbox"
                              checked={riyalSettings.is_hotel_pkr}
                              onChange={(e) =>
                                setRiyalSettings({
                                  ...riyalSettings,
                                  is_hotel_pkr: e.target.checked,
                                })
                              }
                              id="hotelsRatesInPkr"
                              disabled={!isEditingRiyalRate}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="hotelsRatesInPkr"
                            >
                              Hotels Rates In PKR
                            </label>
                          </div>

                          <div className="form-check d-flex align-items-center gap-2">
                            <input
                              className="form-check-input border border-black"
                              type="checkbox"
                              checked={riyalSettings.is_ziarat_pkr}
                              onChange={(e) =>
                                setRiyalSettings({
                                  ...riyalSettings,
                                  is_ziarat_pkr: e.target.checked,
                                })
                              }
                              id="Ziarat Rates In PKR"
                              disabled={!isEditingRiyalRate}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="Ziarat Rates In PKR"
                            >
                              Ziarat Rates In PKR
                            </label>
                          </div>

                          <div className="form-check d-flex align-items-center gap-2">
                            <input
                              className="form-check-input border border-black"
                              type="checkbox"
                              checked={riyalSettings.is_food_pkr}
                              onChange={(e) =>
                                setRiyalSettings({
                                  ...riyalSettings,
                                  is_food_pkr: e.target.checked,
                                })
                              }
                              id="Food Rates In PKR"
                              disabled={!isEditingRiyalRate}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="Food Rates In PKR"
                            >
                              Food Rates In PKR
                            </label>
                          </div>
                          {!isEditingRiyalRate && (
                            <div className="d-flex align-items-center">
                              <button
                                className="btn btn-outline-primary"
                                onClick={toggleEditMode}
                              >
                                Edit
                              </button>
                            </div>
                          )}

                          {isEditingRiyalRate && (
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <button
                                className="btn btn-primary px-3 py-2"
                                onClick={handleSetRiyalRate}
                                disabled={isSettingRiyalRate}
                              >
                                {isSettingRiyalRate ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-2"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    Saving...
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </button>
                              <button
                                className="btn btn-outline-secondary px-3 py-2"
                                onClick={() => setIsEditingRiyalRate(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Section 2: Shirka Name */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <h4 className="fw-bold mb-3">Manage Shirka Name</h4>
                        <div className="col-12 d-flex flex-wrap gap-3">
                          {/* Add/Edit Shirka Section */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              {editingShirkaId
                                ? "Edit Shirka"
                                : "Add New Shirka"}
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none px-1 py-2 mb-2"
                              required
                              placeholder="Shirka Name"
                              value={shirkaName}
                              onChange={(e) => setShirkaName(e.target.value)}
                            />
                          </div>
                          <div className="d-flex align-items-end gap-2 mb-3">
                            <button
                              className="btn btn-primary px-3 py-2"
                              onClick={
                                editingShirkaId
                                  ? handleUpdateShirka
                                  : handleAddShirka
                              }
                              disabled={!shirkaName}
                            >
                              {editingShirkaId ? "Update Shirka" : "Add Shirka"}
                            </button>
                            {editingShirkaId && (
                              <button
                                className="btn btn-outline-secondary px-3 py-2"
                                onClick={() => {
                                  setEditingShirkaId(null);
                                  setShirkaName("");
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>

                          {/* Remove Shirka Section */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              Manage Existing Shirkas
                            </label>
                            <select
                              className="form-select mb-2"
                              value={removeShirka}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                setRemoveShirka(selectedId);
                                if (selectedId) {
                                  const selectedShirka = shirkas.find(
                                    (s) => s.id.toString() === selectedId
                                  );
                                  if (selectedShirka) {
                                    setShirkaName(selectedShirka.name);
                                    setEditingShirkaId(selectedShirka.id);
                                  }
                                } else {
                                  setShirkaName("");
                                  setEditingShirkaId(null);
                                }
                              }}
                              disabled={
                                isLoadingShirkas || shirkas.length === 0
                              }
                            >
                              <option value="">Select Shirka</option>
                              {shirkas.map((shirka) => (
                                <option key={shirka.id} value={shirka.id}>
                                  {shirka.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="d-flex align-items-end mb-3">
                            <button
                              className="btn btn-primary px-3 py-2"
                              onClick={() =>
                                removeShirka && setShowDeleteShirkaModal(true)
                              }
                              disabled={!removeShirka}
                            >
                              Remove Shirka
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sector Section  */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <h4 className="fw-bold mb-3">Sectors</h4>
                        <div className="d-flex flex-wrap gap-3">
                          {/* Add/Edit Sector Section */}
                          <div>
                            <label className="Control-label">
                              {editingSectorId
                                ? "Edit Sector"
                                : "Add New Sector"}
                            </label>
                            <select
                              className="form-select mb-2"
                              value={departureCity}
                              onChange={(e) => setDepartureCity(e.target.value)}
                              disabled={isLoadingCities}
                            >
                              <option value="">Select Departure City</option>
                              {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                  {city.name} ({city.code})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="Control-label" htmlFor="">Arrival City</label>
                            <select
                              className="form-select mb-2"
                              value={arrivalCity}
                              onChange={(e) => setArrivalCity(e.target.value)}
                              disabled={isLoadingCities}
                            >
                              <option value="">Select Arrival City</option>
                              {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                  {city.name} ({city.code})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="Control-label" htmlFor="">Contant Name</label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none px-1 py-2 mb-2"
                              placeholder="Contact Name"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="Control-label" htmlFor="">Contant Number</label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none px-1 py-2 mb-2"
                              placeholder="Contact Number"
                              value={contactNumberSector}
                              onChange={(e) => setContactNumberSector(e.target.value)}
                            />
                          </div>
                          <div className="d-flex align-items-end gap-2 mb-3">
                            <button
                              className="btn btn-primary px-3 py-2"
                              onClick={
                                editingSectorId
                                  ? handleUpdateSector
                                  : handleAddSector
                              }
                              disabled={
                                !departureCity ||
                                !arrivalCity ||
                                departureCity === arrivalCity
                              }
                            >
                              {editingSectorId ? "Update Sector" : "Add Sector"}
                            </button>
                            {editingSectorId && (
                              <button
                                className="btn btn-outline-secondary px-3 py-2"
                                onClick={() => {
                                  setEditingSectorId(null);
                                  setDepartureCity("");
                                  setArrivalCity("");
                                  setContactName("");
                                  setContactNumber("");
                                  setRemoveSector("");
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>

                          {/* Remove Sector Section */}
                          <div>
                            <label className="Control-label">
                              Manage Existing Sectors
                            </label>
                            <select
                              className="form-select mb-2"
                              value={removeSector}
                              onChange={(e) => handleSectorSelect(e.target.value)}
                              disabled={isLoadingSectors || sectors.length === 0}
                            >
                              <option value="">Select Sector</option>
                              {sectors.map((sector) => (
                                <option key={sector.id} value={sector.id}>
                                  {getCityName(sector.departure_city)} →{" "}
                                  {getCityName(sector.arrival_city)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="d-flex align-items-end mb-3">
                            <button
                              className="btn btn-danger px-3 py-2"
                              onClick={() =>
                                removeSector && setShowDeleteSectorModal(true)
                              }
                              disabled={!removeSector}
                            >
                              Remove Sector
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* big-sector */}
                    <div className="p-lg-4 pt-4">
                      <h4 className="fw-bold mb-3">Big Sectors</h4>
                      <div className="row">
                        <div className="d-flex flex-wrap gap-3">

                          {/* Add Section */}
                          <div className="flex-grow-1">
                            <label className="Control-label">
                              {editingIdBig ? `Editing BigSector` : "Add New BigSector"}
                            </label>

                            {/* Selected Sectors Chain Display */}
                            {selectedSmallSectors.length > 0 && (
                              <div className="mb-2 p-2 bg-light rounded">
                                <small className="fw-bold">Selected Chain:</small>
                                <div className="d-flex align-items-center flex-wrap gap-1 mt-1">
                                  {selectedSmallSectors.map((sectorId, index) => {
                                    const sector = smallSectors.find(s => s.id === parseInt(sectorId));
                                    if (!sector) return null;

                                    const departureCode = getCityName(sector.departure_city)?.substring(0, 3).toUpperCase() || 'DEP';
                                    const arrivalCode = getCityName(sector.arrival_city)?.substring(0, 3).toUpperCase() || 'ARR';

                                    return (
                                      <div key={sectorId} className="d-flex align-items-center">
                                        {index > 0 && (
                                          <span className="mx-1 text-muted" style={{ fontSize: '12px' }}>
                                            →
                                          </span>
                                        )}
                                        <span className="badge bg-primary">
                                          {departureCode}→{arrivalCode}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Full Chain Display */}
                                {selectedSmallSectors.length > 0 && (
                                  <div className="mt-2">
                                    <small className="fw-bold">Full Route: </small>
                                    <span className="text-success">
                                      {(() => {
                                        const sectors = selectedSmallSectors.map(id =>
                                          smallSectors.find(s => s.id === parseInt(id))
                                        ).filter(Boolean);

                                        const route = [];
                                        if (sectors.length > 0) {
                                          // Start with first departure
                                          route.push(getCityName(sectors[0].departure_city)?.substring(0, 3).toUpperCase());
                                          // Add all arrivals
                                          sectors.forEach(sector => {
                                            route.push(getCityName(sector.arrival_city)?.substring(0, 3).toUpperCase());
                                          });
                                        }
                                        return route.join(' → ');
                                      })()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <select
                              multiple
                              className="form-select mb-2"
                              size="5"
                              value={selectedSmallSectors}
                              onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, (o) => o.value);
                                setSelectedSmallSectors(selectedOptions);
                              }}
                              style={{ minWidth: '300px' }}
                            >
                              {smallSectors.map((sector) => (
                                <option key={sector.id} value={sector.id.toString()}>
                                  {getCityName(sector.departure_city)} → {getCityName(sector.arrival_city)}
                                </option>
                              ))}
                            </select>

                            <small className="text-muted">
                              • Hold Ctrl/Cmd to select multiple sectors<br />
                              • <strong>Sectors must be sequential</strong> (arrival → departure match)<br />
                              • {selectedSmallSectors.length} sectors selected
                            </small>

                            {/* Real-time Validation */}
                            {selectedSmallSectors.length > 0 && (
                              <div className={`mt-2 ${validateSelectedSectors().isValid ? 'text-success' : 'text-danger'}`}>
                                <small>
                                  <strong>{validateSelectedSectors().message}</strong>
                                </small>
                              </div>
                            )}

                            <div className="d-flex gap-2 mt-2">
                              <button
                                className="btn btn-primary"
                                onClick={handleAdd}
                                disabled={selectedSmallSectors.length === 0 || editingIdBig || !validateSelectedSectors().isValid}
                              >
                                Add BigSector
                              </button>

                              <button
                                className="btn btn-warning"
                                onClick={handleUpdate}
                                disabled={selectedSmallSectors.length === 0 || !editingIdBig || !validateSelectedSectors().isValid}
                              >
                                Update BigSector
                              </button>

                              {editingIdBig && (
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel Edit
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Manage Section */}
                          <div className="flex-grow-1">
                            <label className="Control-label">Manage Existing BigSectors</label>
                            <select
                              className="form-select mb-2"
                              value={removeId}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                setRemoveId(selectedId);
                                if (selectedId) {
                                  handleEditBig(selectedId);
                                } else {
                                  setEditingIdBig(null);
                                  setSelectedSmallSectors([]);
                                }
                              }}
                              style={{ minWidth: '250px' }}
                            >
                              <option value="">Select BigSector to manage</option>
                              {bigSectors.map((bs) => (
                                <option key={bs.id} value={bs.id.toString()}>
                                  {getBigSectorDropdownDisplay(bs)} ({bs.small_sectors?.length || 0} sectors)
                                </option>
                              ))}
                            </select>

                            <div className="d-flex gap-2 mt-2">
                              <button
                                className="btn btn-danger"
                                onClick={handleDeleteBig}
                                disabled={!removeId}
                              >
                                Delete BigSector
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 3 */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <div className="col-12 d-flex flex-wrap gap-3 align-items-center">
                          {/* Toggle Buttons for Visa and Transport Rates */}
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className={`btn ${activeRate === "rate1"
                                ? "btn-primary text-white"
                                : "btn-outline-primary"
                                }`}
                              onClick={() => setActiveRate("rate1")}
                            >
                              Visa and Transport Rate 1
                            </button>
                            <button
                              type="button"
                              className={`btn ${activeRate === "rate2"
                                ? "btn-primary text-white"
                                : "btn-outline-primary"
                                }`}
                              onClick={() => setActiveRate("rate2")}
                            >
                              Visa and Transport Rate 2
                            </button>
                          </div>

                          {/* Radio Buttons - Show current selection */}
                          <div className="d-flex flex-wrap align-items-center gap-3">
                            {isVisaTypeLoading && (
                              <div className="d-flex align-items-center">
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                <span>Loading visa types...</span>
                              </div>
                            )}

                            {!isVisaTypeLoading && (
                              <>
                                <div className="d-flex gap-3">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="radio"
                                      id="type1"
                                      value="type1"
                                      checked={
                                        (activeType || currentVisaType) ===
                                        "type1"
                                      }
                                      onChange={() => setActiveType("type1")}
                                    />

                                    <label
                                      className="form-check-label"
                                      htmlFor="type1"
                                    >
                                      {visaTypeName &&
                                        visaTypeName.includes("1")
                                        ? visaTypeName
                                        : "Type 1"}
                                    </label>
                                  </div>

                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="radio"
                                      id="type2"
                                      value="type2"
                                      checked={
                                        (activeType || currentVisaType) ===
                                        "type2"
                                      }
                                      onChange={() => setActiveType("type2")}
                                    />

                                    <label
                                      className="form-check-label"
                                      htmlFor="type2"
                                    >
                                      {visaTypeName &&
                                        visaTypeName.includes("2")
                                        ? visaTypeName
                                        : "Type 2"}
                                    </label>
                                  </div>
                                </div>

                                <div className="border-start ps-3">
                                  <strong>Current Selection:</strong>
                                  <div className="text-primary fw-bold">
                                    {activeType || currentVisaType
                                      ? visaTypeName ||
                                      (activeType === "type1"
                                        ? "Type 1"
                                        : "Type 2")
                                      : "Not set"}
                                  </div>
                                </div>

                                {activeType &&
                                  activeType !== currentVisaType && (
                                    <button
                                      className="btn btn-primary ms-3"
                                      onClick={saveVisaType}
                                      disabled={isSaving}
                                    >
                                      {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conditionally render sections based on activeRate */}
                    {activeRate === "rate1" ? (
                      <>
                        {/* Rate 1 Sections */}
                        {/* 3 */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">
                              Umrah Visa with 28 days stay + Hotels
                              {/* {isLoadingVisaPrices && (
                        <span
                          className="spinner-border spinner-border-sm ms-2"
                          role="status"
                        ></span>
                      )} */}
                            </h4>
                            <div className="col-12 d-flex flex-wrap gap-3">
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Adult
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="600"
                                  value={visa28Adult}
                                  onChange={(e) =>
                                    setVisa28Adult(e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <label htmlFor="" className="Control-label">
                                  Child{" "}
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="500"
                                  value={visa28Child}
                                  onChange={(e) =>
                                    setVisa28Child(e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <label htmlFor="" className="Control-label">
                                  Infants
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="600"
                                  value={visa28Infants}
                                  onChange={(e) =>
                                    setVisa28Infants(e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Max Nights
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="16"
                                  value={visa28MaxNights}
                                  onChange={(e) =>
                                    setVisa28MaxNights(e.target.value)
                                  }
                                />
                              </div>

                              <div className="d-flex align-items-center">
                                {!isEditingVisa28 && (
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => setIsEditingVisa28(true)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>

                              {isEditingVisa28 && (
                                <div className="d-flex align-items-center gap-2 mb-3">
                                  <button
                                    className="btn btn-primary px-3 py-2"
                                    onClick={handleSetVisaPrice}
                                    disabled={isSettingVisaPrice}
                                  >
                                    {isSettingVisaPrice ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {editingVisaPriceId
                                          ? "Updating..."
                                          : "Setting..."}
                                      </>
                                    ) : editingVisaPriceId ? (
                                      "Update Price"
                                    ) : (
                                      "Set Price"
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary px-3 py-2"
                                    onClick={() => setIsEditingVisa28(false)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* 4 */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">
                              Umrah Visa with Long stay + Hotels
                            </h4>
                            <div className="col-12 d-flex flex-wrap gap-3">
                              {/* Adult price field */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Adult
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="600"
                                  value={visaLongAdult}
                                  onChange={(e) =>
                                    setVisaLongAdult(e.target.value)
                                  }
                                />
                              </div>

                              {/* Child price field */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Child
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="500"
                                  value={visaLongChild}
                                  onChange={(e) =>
                                    setVisaLongChild(e.target.value)
                                  }
                                />
                              </div>

                              {/* Infants price field */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Infants
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="600"
                                  value={visaLongInfants}
                                  onChange={(e) =>
                                    setVisaLongInfants(e.target.value)
                                  }
                                />
                              </div>

                              {/* Max nights field */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Max Nights
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="16"
                                  value={visaLongMaxNights}
                                  onChange={(e) =>
                                    setVisaLongMaxNights(e.target.value)
                                  }
                                />
                              </div>
                              <div className="d-flex align-items-center">
                                {!isEditingVisaLong && (
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => setIsEditingVisaLong(true)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>

                              {isEditingVisaLong && (
                                <div className="d-flex align-items-center gap-2 mb-3">
                                  <button
                                    className="btn btn-primary px-3 py-2"
                                    onClick={handleSetVisaLongPrice}
                                    disabled={isSettingVisaLongPrice}
                                  >
                                    {isSettingVisaLongPrice ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {editingVisaLongPriceId
                                          ? "Updating..."
                                          : "Setting..."}
                                      </>
                                    ) : editingVisaLongPriceId ? (
                                      "Update Price"
                                    ) : (
                                      "Set Price"
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary px-3 py-2"
                                    onClick={() => setIsEditingVisaLong(false)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* 5 */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">
                              Umrah Visa with 28 days stay
                            </h4>
                            <div className="col-12 d-flex flex-wrap gap-3">
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Adult
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="600"
                                  value={visa28OnlyAdult}
                                  onChange={(e) =>
                                    setVisa28OnlyAdult(e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <label htmlFor="" className="Control-label">
                                  Child
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="500"
                                  value={visa28OnlyChild}
                                  onChange={(e) =>
                                    setVisa28OnlyChild(e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <label htmlFor="" className="Control-label">
                                  Infants
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  required
                                  placeholder="600"
                                  value={visa28OnlyInfants}
                                  onChange={(e) =>
                                    setVisa28OnlyInfants(e.target.value)
                                  }
                                />
                              </div>
                              <div className="d-flex align-items-center">
                                {!isEditingVisa28Only && (
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => setIsEditingVisa28Only(true)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                              {isEditingVisa28Only && (
                                <div className="d-flex align-items-center gap-2 mb-3">
                                  <button
                                    className="btn btn-primary px-3 py-2"
                                    onClick={handleSetVisa28OnlyPrice}
                                    disabled={isSettingVisa28OnlyPrice}
                                  >
                                    {isSettingVisa28OnlyPrice ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {editingVisa28OnlyPriceId
                                          ? "Updating..."
                                          : "Setting..."}
                                      </>
                                    ) : editingVisa28OnlyPriceId ? (
                                      "Update Price"
                                    ) : (
                                      "Set Price"
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary px-3 py-2"
                                    onClick={() =>
                                      setIsEditingVisa28Only(false)
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* 6 */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">
                              Umrah Visa with Long Stay
                            </h4>
                            <div className="col-12 d-flex flex-wrap gap-3">
                              {/* Adult Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Adult
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={visaLongOnlyAdult}
                                  onChange={(e) =>
                                    setVisaLongOnlyAdult(e.target.value)
                                  }
                                  placeholder="600"
                                />
                              </div>

                              {/* Child Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Child
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={visaLongOnlyChild}
                                  onChange={(e) =>
                                    setVisaLongOnlyChild(e.target.value)
                                  }
                                  placeholder="500"
                                />
                              </div>

                              {/* Infant Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Infants
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={visaLongOnlyInfants}
                                  onChange={(e) =>
                                    setVisaLongOnlyInfants(e.target.value)
                                  }
                                  placeholder="600"
                                />
                              </div>
                              <div className="d-flex align-items-center">
                                {!isEditingVisaLongOnly && (
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() =>
                                      setIsEditingVisaLongOnly(true)
                                    }
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                              {isEditingVisaLongOnly && (
                                <div className="d-flex align-items-center gap-2 mb-3">
                                  <button
                                    className="btn btn-primary px-3 py-2"
                                    onClick={handleSetVisaLongOnlyPrice}
                                    disabled={isSettingVisaLongOnly}
                                  >
                                    {isSettingVisaLongOnly ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {editingVisaLongOnlyId
                                          ? "Updating..."
                                          : "Setting..."}
                                      </>
                                    ) : editingVisaLongOnlyId ? (
                                      "Update Price"
                                    ) : (
                                      "Set Price"
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary px-3 py-2"
                                    onClick={() =>
                                      setIsEditingVisaLongOnly(false)
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* 7 */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">
                              Add transport sector
                            </h4>
                            <div className="col-12 d-flex flex-wrap gap-3">
                              {/* Sector Name */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Write sector
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportSector}
                                  onChange={(e) =>
                                    setTransportSector(e.target.value)
                                  }
                                  placeholder="sector"
                                />
                              </div>

                              {/* Vehicle Type */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Vehicle Type
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={vehicleType}
                                  onChange={(e) =>
                                    setVehicleType(e.target.value)
                                  }
                                  placeholder="e.g., Bus, Car"
                                />
                              </div>

                              {/* Adult Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Adult
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportAdult}
                                  onChange={(e) =>
                                    setTransportAdult(e.target.value)
                                  }
                                  placeholder="600"
                                />
                              </div>

                              {/* Child Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Child
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportChild}
                                  onChange={(e) =>
                                    setTransportChild(e.target.value)
                                  }
                                  placeholder="500"
                                />
                              </div>

                              {/* Infant Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Infants
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportInfants}
                                  onChange={(e) =>
                                    setTransportInfants(e.target.value)
                                  }
                                  placeholder="600"
                                />
                              </div>

                              {/* With Visa Checkbox */}
                              <div className="form-check d-flex align-items-center gap-2">
                                <input
                                  className="form-check-input border border-black"
                                  type="checkbox"
                                  checked={withVisa}
                                  onChange={() => setWithVisa(!withVisa)}
                                  id="withVisa"
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="withVisa"
                                >
                                  With Visa
                                </label>
                              </div>

                              {/* Add/Update Button */}
                              <div className="d-flex align-items-end mb-3">
                                <button
                                  className="btn btn-primary small"
                                  onClick={handleAddTransportSector}
                                  disabled={isSettingTransport}
                                >
                                  {isSettingTransport ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2"></span>
                                      {editingTransportId
                                        ? "Updating..."
                                        : "Adding..."}
                                    </>
                                  ) : editingTransportId ? (
                                    "Update Sector"
                                  ) : (
                                    "Add Sector"
                                  )}
                                </button>
                              </div>

                              {/* Select Sector to Remove */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Select sector
                                </label>
                                <select
                                  className="form-select"
                                  value={removeTransport}
                                  onChange={handleTransportSelect}
                                  disabled={transportSectors.length === 0}
                                >
                                  <option value="">Select Sector</option>
                                  {transportSectors.map((sector) => (
                                    <option key={sector.id} value={sector.id}>
                                      {sector.name} ({sector.vehicle_type})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Remove Button */}
                              <div className="d-flex align-items-end mb-3">
                                <button
                                  className="btn btn-danger px-3 py-2"
                                  onClick={() =>
                                    removeTransport &&
                                    setShowDeleteTransportModal(true)
                                  }
                                  disabled={!removeTransport}
                                >
                                  Remove sector
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Rate 2 Sections */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">
                              Visa Rates Pex Wise
                            </h4>
                            <div className="col-12">
                              <div className="row g-3">
                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Visa Title
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    placeholder="Pexs"
                                    value={visaTitle}
                                    onChange={(e) =>
                                      setVisaTitle(e.target.value)
                                    }
                                  />
                                </div>

                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Person From
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="1"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    value={personFrom}
                                    onChange={(e) =>
                                      setPersonFrom(e.target.value)
                                    }
                                  />
                                </div>

                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Person To
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="1"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    value={personTo}
                                    onChange={(e) =>
                                      setPersonTo(e.target.value)
                                    }
                                  />
                                </div>

                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Adult
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="600"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    value={adultPrice}
                                    onChange={(e) =>
                                      setAdultPrice(e.target.value)
                                    }
                                  />
                                </div>

                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Child
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="500"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    value={childPrice}
                                    onChange={(e) =>
                                      setChildPrice(e.target.value)
                                    }
                                  />
                                </div>

                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Infant
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="600"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    value={infantPrice}
                                    onChange={(e) =>
                                      setInfantPrice(e.target.value)
                                    }
                                  />
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-3 mt-4 flex-wrap">
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input
                                    className="form-check-input border border-black"
                                    type="checkbox"
                                    id="withTransport"
                                    checked={withTransport}
                                    onChange={() =>
                                      setWithTransport(!withTransport)
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor="withTransport"
                                  >
                                    With Transport
                                  </label>
                                </div>

                                <button
                                  className="btn btn-primary"
                                  onClick={handleShowHotels}
                                >
                                  Select Hotels
                                </button>

                                <button
                                  className="btn btn-primary"
                                  onClick={handleShowVehicleTypes}>
                                  Select Vehicle Types
                                </button>

                                {/* Hotel Selection Modal */}
                                <Modal
                                  show={showHotelModal}
                                  onHide={handleCloseHotels}
                                  centered
                                >
                                  <Modal.Header closeButton>
                                    <Modal.Title>
                                      Select Available Hotels
                                    </Modal.Title>
                                  </Modal.Header>
                                  <Modal.Body>
                                    {availableHotels.length === 0 ? (
                                      <p>No hotels available</p>
                                    ) : (
                                      <ListGroup>
                                        {availableHotels.map((hotel) => (
                                          <ListGroup.Item
                                            key={hotel.id}
                                            action
                                            onClick={() =>
                                              toggleHotelSelection(hotel.id)
                                            }
                                            active={selectedHotelIds.includes(
                                              hotel.id
                                            )}
                                            style={{ cursor: "pointer" }}
                                          >
                                            {hotel.name}{" "}
                                            {/* Display hotel name */}
                                          </ListGroup.Item>
                                        ))}
                                      </ListGroup>
                                    )}
                                  </Modal.Body>
                                  <Modal.Footer>
                                    <Button
                                      variant="secondary"
                                      onClick={handleCloseHotels}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      onClick={handleSaveHotels}
                                      disabled={selectedHotelIds.length === 0}
                                    >
                                      Save Selection
                                    </Button>
                                  </Modal.Footer>
                                </Modal>

                                {/* Vehicle Type Selection Modal (new) */}
                                <Modal show={showVehicleTypeModal} onHide={handleCloseVehicleTypes} centered size="lg">
                                  <Modal.Header closeButton>
                                    <Modal.Title>Select Vehicle Types</Modal.Title>
                                  </Modal.Header>
                                  <Modal.Body>
                                    {vehicleTypes.length === 0 ? (
                                      <p>No vehicle types available. Please add vehicle types first.</p>
                                    ) : (
                                      <div>
                                        <p className="text-muted mb-3">Select vehicle types to associate with this visa:</p>
                                        <ListGroup>
                                          {vehicleTypes.map((vehicleType) => (
                                            <ListGroup.Item
                                              key={vehicleType.id}
                                              action
                                              onClick={() => toggleVehicleTypeSelection(vehicleType.id)}
                                              active={selectedVehicleTypeIds.includes(vehicleType.id)}
                                              style={{ cursor: "pointer" }}
                                            >
                                              <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                  <strong>{vehicleType.vehicle_name}</strong> ({vehicleType.vehicle_type})
                                                  <br />
                                                  <small className="text-muted">
                                                    Price: {vehicleType.price} -
                                                    {vehicleType.small_sector ? ` Small Sector` : ''}
                                                    {vehicleType.big_sector ? ` Big Sector` : ''}
                                                    {vehicleType.small_sector_id ? ` Small Sector` : ''}
                                                    {vehicleType.big_sector_id ? ` Big Sector` : ''}
                                                  </small>
                                                </div>
                                                {selectedVehicleTypeIds.includes(vehicleType.id) && (
                                                  <span className="text-success">✓</span>
                                                )}
                                              </div>
                                            </ListGroup.Item>
                                          ))}
                                        </ListGroup>
                                      </div>
                                    )}
                                  </Modal.Body>
                                  <Modal.Footer>
                                    <Button variant="secondary" onClick={handleCloseVehicleTypes}>
                                      Cancel
                                    </Button>
                                    <Button variant="primary" onClick={handleSaveVehicleTypes}>
                                      Save Selection ({selectedVehicleTypeIds.length} selected)
                                    </Button>
                                  </Modal.Footer>
                                </Modal>

                                <button
                                  className="btn btn-primary"
                                  onClick={handleVisaTypeTwoSubmit}
                                  disabled={isSettingVisaTypeTwo}
                                >
                                  {isSettingVisaTypeTwo ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2"></span>
                                      {editingVisaTypeTwoId
                                        ? "Updating..."
                                        : "Adding..."}
                                    </>
                                  ) : editingVisaTypeTwoId ? (
                                    "Update Visa"
                                  ) : (
                                    "Add Visa"
                                  )}
                                </button>

                                {/* Select Visa to Edit/Remove */}
                                <div>
                                  <label htmlFor="" className="Control-label">
                                    Visa Title
                                  </label>
                                  <select
                                    className="form-select"
                                    value={editingVisaTypeTwoId || ""}
                                    onChange={handleVisaSelectChange}
                                    disabled={isLoadingVisaTypeTwo}
                                  >
                                    <option value="">All Titles</option>
                                    {visaTypeTwoData.map((visa) => (
                                      <option key={visa.id} value={visa.id}>
                                        {visa.title || "Untitled Visa"}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <button
                                  className="btn btn-danger"
                                  onClick={() =>
                                    editingVisaTypeTwoId &&
                                    setShowDeleteVisaModal(true)
                                  }
                                  disabled={!editingVisaTypeTwoId}
                                >
                                  Remove Visa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">Only Visa Rates</h4>
                            <div className="col-12">
                              <div className="row g-3 align-items-end">
                                {/* Adult Price */}
                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Adult Price
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    placeholder="Adult Price"
                                    value={onlyVisaAdult}
                                    onChange={(e) =>
                                      setOnlyVisaAdult(e.target.value)
                                    }
                                  />
                                </div>

                                {/* Child Price */}
                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Child Price
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    placeholder="Child Price"
                                    value={onlyVisaChild}
                                    onChange={(e) =>
                                      setOnlyVisaChild(e.target.value)
                                    }
                                  />
                                </div>

                                {/* Infant Price */}
                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Infant Price
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    placeholder="Infant Price"
                                    value={onlyVisaInfant}
                                    onChange={(e) =>
                                      setOnlyVisaInfant(e.target.value)
                                    }
                                  />
                                </div>

                                {/* Min Days */}
                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Min Days
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    placeholder="Min Days"
                                    value={minDays}
                                    onChange={(e) => setMinDays(e.target.value)}
                                  />
                                </div>

                                {/* Max Days */}
                                <div className="col-md-2">
                                  <label htmlFor="" className="Control-label">
                                    Max Days
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control rounded shadow-none  px-1 py-2"
                                    placeholder="Max Days"
                                    value={maxDays}
                                    onChange={(e) => setMaxDays(e.target.value)}
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className=" d-flex flex-wrap gap-2 align-items-center">
                                  <div className="col-md-2">
                                    <label htmlFor="" className="Control-label">
                                      City Name
                                    </label>
                                    <select
                                      className="form-select"
                                      value={airportId}
                                      onChange={(e) => {
                                        const selectedId = e.target.value;
                                        setAirportId(selectedId);
                                        const selectedCity = cities.find(
                                          (c) => c.id.toString() === selectedId
                                        );
                                        if (selectedCity) {
                                          setAirport(
                                            `${selectedCity.name} (${selectedCity.code})`
                                          );
                                        }
                                      }}
                                    >
                                      <option value="">Select City</option>
                                      {cities.map((city) => (
                                        <option key={city.id} value={city.id}>
                                          {city.name} ({city.code})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="col-md-2">
                                    <div className="form-check form-switch mt-4">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="statusSwitch"
                                        checked={status === "active"}
                                        onChange={(e) => setStatus(e.target.checked ? "active" : "inactive")}
                                      />
                                      <label className="form-check-label" htmlFor="statusSwitch">
                                        {status === "active" ? "Active" : "Inactive"}
                                      </label>
                                    </div>
                                  </div>

                                  <div className="col-md-5">
                                    <button
                                      className="btn btn-primary"
                                      onClick={handleSetOnlyVisaPrices}
                                      disabled={isSettingOnlyVisa}
                                    >
                                      {selectedVisaPrice
                                        ? isSettingOnlyVisa
                                          ? "Updating..."
                                          : "Update"
                                        : isSettingOnlyVisa
                                          ? "Saving..."
                                          : "Save"}
                                    </button>

                                    <button
                                      className="btn btn-secondary"
                                      onClick={() => {
                                        resetFormFields();
                                        setIsEditingOnlyVisa(false);
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  <div className="col-md-3">
                                    <label htmlFor="" className="Control-label">
                                      Select Visa Price
                                    </label>
                                    <select
                                      className="form-select"
                                      value={selectedVisaPrice?.id || ""}
                                      onChange={(e) => {
                                        const selectedId = parseInt(e.target.value);
                                        if (!selectedId) {
                                          setSelectedVisaPrice(null);
                                          resetFormFields();
                                          return;
                                        }

                                        const selected = onlyVisaPrices.find(
                                          price => price.id === selectedId
                                        );

                                        setSelectedVisaPrice(selected || null);

                                        if (selected) {
                                          setOnlyVisaAdult(selected.adault_price?.toString() || "");
                                          setOnlyVisaChild(selected.child_price?.toString() || "");
                                          setOnlyVisaInfant(selected.infant_price?.toString() || "");
                                          setMinDays(selected.min_days?.toString() || "");
                                          setMaxDays(selected.max_days?.toString() || "");
                                          setStatus(selected.status || "");

                                          // Correctly set the airport ID from the city object
                                          if (selected.city && selected.city.id) {
                                            setAirportId(selected.city.id.toString());
                                            setAirport(`${selected.city.name} (${selected.city.code})`);
                                          } else {
                                            setAirportId("");
                                            setAirport("");
                                          }

                                          setIsEditingOnlyVisa(true);
                                        } else {
                                          resetFormFields();
                                        }
                                      }}
                                    >
                                      <option value="">Create New Visa Price</option>
                                      {onlyVisaPrices && onlyVisaPrices.length > 0 ? (
                                        onlyVisaPrices.map((price) => (
                                          <option key={price.id} value={price.id}>
                                            {price.city?.name || "Unnamed"} -
                                            Adult: {price.adault_price || "0"}
                                          </option>
                                        ))
                                      ) : (
                                        <option disabled>No visa prices available</option>
                                      )}
                                    </select>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    {selectedVisaPrice && (
                                      <button
                                        className="btn btn-danger"
                                        onClick={handleDeleteVisaPrice}
                                        disabled={isDeleting}
                                      >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4 */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">
                              Transport Type2 Sectors
                              {isLoadingTransportType2 && (
                                <span className="spinner-border spinner-border-sm ms-2"></span>
                              )}
                            </h4>
                            <div className="col-12 d-flex flex-wrap gap-3">
                              {/* Sector Name */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Sector Name
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportType2Sector}
                                  onChange={(e) =>
                                    setTransportType2Sector(e.target.value)
                                  }
                                  placeholder="Enter sector name"
                                />
                              </div>

                              {/* Vehicle Type */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Vehicle Type
                                </label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportType2VehicleType}
                                  onChange={(e) =>
                                    setTransportType2VehicleType(e.target.value)
                                  }
                                  placeholder="e.g., Bus, Car"
                                />
                              </div>

                              {/* Adult Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Adult Price
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportType2Adult}
                                  onChange={(e) =>
                                    setTransportType2Adult(e.target.value)
                                  }
                                  placeholder="600"
                                />
                              </div>

                              {/* Child Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Child Price
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportType2Child}
                                  onChange={(e) =>
                                    setTransportType2Child(e.target.value)
                                  }
                                  placeholder="500"
                                />
                              </div>

                              {/* Infant Price */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Infant Price
                                </label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none  px-1 py-2"
                                  value={transportType2Infants}
                                  onChange={(e) =>
                                    setTransportType2Infants(e.target.value)
                                  }
                                  placeholder="600"
                                />
                              </div>

                              <div className="form-check d-flex align-items-center gap-2">
                                <input
                                  className="form-check-input border border-black"
                                  type="checkbox"
                                  checked={onlyTransportCharges}
                                  onChange={() =>
                                    setOnlyTransportCharges(
                                      !onlyTransportCharges
                                    )
                                  }
                                  id="onlyTransportCharges"
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="onlyTransportCharges"
                                >
                                  Only Transport Charges Else No Charges
                                </label>
                              </div>

                              {/* Submit Button */}
                              <div className="d-flex align-items-end mb-3">
                                <button
                                  className="btn btn-primary px-3 py-2"
                                  onClick={handleTransportType2Submit}
                                  disabled={isSettingTransportType2}
                                >
                                  {isSettingTransportType2 ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2"></span>
                                      {editingTransportType2Id
                                        ? "Updating..."
                                        : "Adding..."}
                                    </>
                                  ) : editingTransportType2Id ? (
                                    "Update Sector"
                                  ) : (
                                    "Add Sector"
                                  )}
                                </button>
                              </div>

                              {/* Select Sector */}
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Select Sector
                                </label>
                                <select
                                  className="form-select"
                                  value={removeTransportType2}
                                  onChange={handleTransportType2Select}
                                  disabled={transportType2Sectors.length === 0}
                                >
                                  <option value="">Select Sector</option>
                                  {transportType2Sectors.map((sector) => (
                                    <option key={sector.id} value={sector.id}>
                                      {sector.name} ({sector.vehicle_type})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Remove Button */}
                              <div className="d-flex align-items-end mb-3">
                                <button
                                  className="btn btn-danger px-3 py-2"
                                  onClick={() =>
                                    removeTransportType2 &&
                                    setShowDeleteTransportType2Modal(true)
                                  }
                                  disabled={
                                    !removeTransportType2 ||
                                    removeTransportType2 === "All Sectors"
                                  }
                                >
                                  Remove Sector
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* vehicle type */}
                        <div className="p-lg-4 pt-4">
                          <div className="row">
                            <h4 className="fw-bold mb-3">Vehicle Type</h4>
                            <div className="col-12 d-flex flex-wrap gap-3">

                              {/* Vehicle Name */}
                              <div>
                                <label htmlFor="" className="control-label">Vehicle Name *</label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none px-1 py-2"
                                  value={vehicleTypeName}
                                  onChange={(e) => setVehicleTypeName(e.target.value)}
                                  placeholder="Enter vehicle name"
                                />
                              </div>

                              {/* Vehicle Type */}
                              <div>
                                <label htmlFor="" className="control-label">Vehicle Type *</label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none px-1 py-2"
                                  value={vehicleTypeType}
                                  onChange={(e) => setVehicleTypeType(e.target.value)}
                                  placeholder="e.g., Bus, Car"
                                />
                              </div>

                              {/* Price */}
                              <div>
                                <label htmlFor="" className="control-label">Price *</label>
                                <input
                                  type="number"
                                  className="form-control rounded shadow-none px-1 py-2"
                                  value={vehicleTypePrice}
                                  onChange={(e) => setVehicleTypePrice(e.target.value)}
                                  placeholder="600"
                                  step="0.01"
                                />
                              </div>

                              {/* Note */}
                              <div>
                                <label htmlFor="" className="control-label">Note</label>
                                <input
                                  type="text"
                                  className="form-control rounded shadow-none px-1 py-2"
                                  value={vehicleTypeNote}
                                  onChange={(e) => setVehicleTypeNote(e.target.value)}
                                  placeholder="Optional note"
                                />
                              </div>

                              {/* Sector Selection */}
                              <div>
                                <label htmlFor="" className="control-label">Select Sector *</label>
                                <select
                                  className="form-select rounded shadow-none px-1 py-2"
                                  value={vehicleTypeSectorId}
                                  onChange={(e) => setVehicleTypeSectorId(parseInt(e.target.value))}
                                >
                                  <option value="0">Select Sector</option>

                                  {/* Small Sectors */}
                                  <optgroup label="Small Sectors">
                                    {smallSectors.map((sector) => (
                                      <option key={`small-${sector.id}`} value={sector.id}>
                                        {getCityNameWithCode(sector.departure_city)} → {getCityNameWithCode(sector.arrival_city)}
                                      </option>
                                    ))}
                                  </optgroup>

                                  {/* Big Sectors */}
                                  <optgroup label="Big Sectors">
                                    {bigSectors.map((bigSector) => (
                                      <option key={`big-${bigSector.id}`} value={bigSector.id}>
                                        {getBigSectorDisplayName(bigSector)}
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>

                                {/* Show selected sector type */}
                                {vehicleTypeSectorId > 0 && (
                                  <div className="small text-muted mt-1">
                                    Selected: {getSectorDisplayName(vehicleTypeSectorId)}
                                  </div>
                                )}
                              </div>

                              {/* Status */}
                              <div className="form-check d-flex align-items-center gap-2 mt-4">
                                <input
                                  className="form-check-input border border-black"
                                  type="checkbox"
                                  checked={vehicleTypeStatus === 'active'}
                                  onChange={(e) => setVehicleTypeStatus(e.target.checked ? 'active' : 'inactive')}
                                  id="vehicleTypeStatusCheckbox"
                                />
                                <label className="form-check-label" htmlFor="vehicleTypeStatusCheckbox">
                                  Active
                                </label>
                              </div>

                              {/* Submit Button */}
                              <div className="d-flex align-items-end mb-3">
                                <button
                                  className="btn btn-primary px-3 py-2"
                                  onClick={handleVehicleTypeSubmit}
                                  disabled={isSubmittingVehicleType || !vehicleTypeName || !vehicleTypeType || !vehicleTypePrice || !vehicleTypeSectorId}
                                >
                                  {isSubmittingVehicleType ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2"></span>
                                      {editingVehicleTypeId ? "Updating..." : "Adding..."}
                                    </>
                                  ) : editingVehicleTypeId ? (
                                    "Update Vehicle Type"
                                  ) : (
                                    "Add Vehicle Type"
                                  )}
                                </button>
                              </div>

                              {/* Select Existing Vehicle Type */}
                              <div>
                                <label htmlFor="" className="control-label">Manage Vehicle Types</label>
                                <select
                                  className="form-select"
                                  value={selectedVehicleTypeId}
                                  onChange={handleVehicleTypeSelect}
                                  disabled={vehicleTypes.length === 0}
                                >
                                  <option value="">Select Vehicle Type to Edit</option>
                                  {vehicleTypes.map((vehicleType) => (
                                    <option key={vehicleType.id} value={vehicleType.id}>
                                      {vehicleType.vehicle_name} ({vehicleType.vehicle_type}) -
                                      {vehicleType.small_sector ? ' Small Sector' : ''}
                                      {vehicleType.big_sector ? ' Big Sector' : ''}
                                      {vehicleType.small_sector_id ? ' Small Sector' : ''}
                                      {vehicleType.big_sector_id ? ' Big Sector' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Action Buttons */}
                              <div className="d-flex align-items-end gap-2 mb-3">
                                <button
                                  className="btn btn-danger px-3 py-2"
                                  onClick={() => selectedVehicleTypeId && setShowDeleteVehicleTypeModal(true)}
                                  disabled={!selectedVehicleTypeId}
                                >
                                  Delete Vehicle Type
                                </button>

                                <button
                                  className="btn btn-secondary px-3 py-2"
                                  onClick={resetVehicleTypeForm}
                                  disabled={!vehicleTypeName && !vehicleTypeType && !vehicleTypePrice}
                                >
                                  Clear Form
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Delete Confirmation Modal */}
                          <Modal show={showDeleteVehicleTypeModal} onHide={() => setShowDeleteVehicleTypeModal(false)} centered>
                            <Modal.Header closeButton>
                              <Modal.Title>Confirm Delete</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              Are you sure you want to delete this vehicle type? This action cannot be undone.
                            </Modal.Body>
                            <Modal.Footer>
                              <Button variant="secondary" onClick={() => setShowDeleteVehicleTypeModal(false)}>
                                Cancel
                              </Button>
                              <Button variant="danger" onClick={handleVehicleTypeDelete}>
                                Delete
                              </Button>
                            </Modal.Footer>
                          </Modal>
                        </div>
                      </>
                    )}

                    {/* food section */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <h4 className="fw-bold mb-3">Food Prices </h4>

                        {error && (
                          <div className="alert alert-danger mb-3" role="alert">
                            {error}
                          </div>
                        )}

                        <div className="col-12">
                          <div className="row g-3">
                            {/* Title */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Title
                              </label>
                              <input
                                type="text"
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Food Price Title"
                                value={foodFormData.title}
                                onChange={(e) => handleInputChange(e)}
                                name="title"
                              />
                            </div>

                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Description
                              </label>
                              <input
                                type="text"
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Food Price description"
                                value={foodFormData.description}
                                onChange={(e) => handleInputChange(e)}
                                name="description"
                              />
                            </div>

                            {/* Minimum Persons */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Mini Persons
                              </label>
                              <input
                                type="number"
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Minimum Persons"
                                value={foodFormData.min_pex}
                                onChange={(e) => handleInputChange(e)}
                                name="min_pex"
                                min="1"
                              />
                            </div>

                            {/* Price Per Person */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Price Per Person
                              </label>
                              <input
                                type="number"
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Price Per Person"
                                value={foodFormData.per_pex}
                                onChange={(e) => handleInputChange(e)}
                                name="per_pex"
                                min="0"
                              />
                            </div>

                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Price
                              </label>
                              <input
                                type="number"
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Price"
                                value={foodFormData.price}
                                onChange={(e) => handleInputChange(e)}
                                name="price"
                                min="0"
                              />
                            </div>

                            <div className="col-md-2">
                              <label htmlFor="citySelect" className="Control-label">
                                City
                              </label>
                              <select
                                id="citySelect"
                                className="form-select rounded shadow-none px-1 py-2"
                                name="city_id"
                                value={foodFormData.city_id}
                                onChange={handleInputChange}
                              >
                                <option value="">Select City</option>
                                {foodCities && foodCities.length > 0 ? (
                                  foodCities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                      {city.name} ({city.code})
                                    </option>
                                  ))
                                ) : (
                                  <option disabled>No cities available</option>
                                )}
                              </select>
                            </div>


                            {/* Active Status */}
                            <div className="col-md-1 d-flex align-items-center">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={foodFormData.active}
                                  onChange={(e) => handleInputChange(e)}
                                  name="active"
                                  id="activeCheck"
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="activeCheck"
                                >
                                  Active
                                </label>
                              </div>
                            </div>

                            <div className="col-md-3 gap-2 d-flex align-items-center">
                              <button
                                className="btn btn-primary"
                                onClick={handleSubmitFood}
                                disabled={
                                  loading ||
                                  !foodFormData.title ||
                                  !foodFormData.min_pex ||
                                  !foodFormData.per_pex
                                }
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    {isEditing ? "Updating..." : "Saving..."}
                                  </>
                                ) : isEditing ? (
                                  "Update Food Price"
                                ) : (
                                  "Save Food Price"
                                )}
                              </button>
                              {(editingId ||
                                foodFormData.title ||
                                foodFormData.min_pex ||
                                foodFormData.per_pex) && (
                                  <button
                                    className="btn btn-secondary"
                                    onClick={resetForm}
                                  >
                                    Clear
                                  </button>
                                )}
                            </div>

                            {/* Select Existing Food Price */}
                            <div className="col-md-3 d-flex gap-2">
                              <div>
                                <label htmlFor="" className="Control-label">
                                  Select Food Price
                                </label>
                                <select
                                  className="form-select"
                                  value={currentId || ""}
                                  onChange={(e) => {
                                    const id = e.target.value;
                                    setCurrentId(id || null);
                                    if (id) {
                                      const selected = foodPrices.find(
                                        (p) => p.id.toString() === id
                                      );
                                      if (selected) {
                                        setFoodFormData({
                                          title: selected.title,
                                          min_pex: selected.min_pex,
                                          per_pex: selected.per_pex,
                                          price: selected.price,
                                          description: selected.description,
                                          city_id: selected.city?.id || "", // Fix: access city ID from nested object
                                          active: selected.active,
                                          organization: orgId,
                                        });
                                        setIsEditing(true);
                                        setEditingId(id);
                                      }
                                    } else {
                                      resetForm();
                                    }
                                  }}
                                >
                                  <option value="">Create New Food Price</option>
                                  {foodPrices.map((price) => (
                                    <option key={price.id} value={price.id}>
                                      {price.title} {price.city ? `- ${price.city.name}` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="d-flex align-items-center">
                                {currentId && (
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                      if (window.confirm("Are you sure you want to delete this food price?")) {
                                        handleDelete(currentId);
                                      }
                                    }}
                                    disabled={loading}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ziarat Prices Section */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <h4 className="fw-bold mb-3">Ziarat Prices</h4>
                        <div className="col-12">
                          <div className="row g-3 mb-4">
                            {/* City */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                City
                              </label>
                              <select
                                className="form-select rounded shadow-none px-1 py-2"
                                name="city_id"
                                value={ziaratFormData.city_id}
                                onChange={handleZiaratInputChange}
                              >
                                <option value="">Select City</option>
                                {ziaratCities.map((city) => (
                                  <option key={city.id} value={city.id.toString()}>
                                    {city.name} ({city.code})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Ziarat Title */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Ziarat Title *
                              </label>
                              <input
                                type="text"
                                className="form-control rounded shadow-none px-1 py-2"
                                placeholder="Ziarat Title"
                                name="ziarat_title"
                                value={ziaratFormData.ziarat_title}
                                onChange={handleZiaratInputChange}
                              />
                            </div>

                            {/* Description */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Description
                              </label>
                              <input
                                type="text"
                                className="form-control rounded shadow-none px-1 py-2"
                                placeholder="Description"
                                name="description"
                                value={ziaratFormData.description}
                                onChange={handleZiaratInputChange}
                              />
                            </div>

                            {/* Contact Person */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Contact Person *
                              </label>
                              <input
                                type="text"
                                className="form-control rounded shadow-none px-1 py-2"
                                placeholder="Contact Person"
                                name="contact_person"
                                value={ziaratFormData.contact_person}
                                onChange={handleZiaratInputChange}
                              />
                            </div>

                            {/* Contact Number */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Contact Number *
                              </label>
                              <input
                                type="text"
                                className="form-control rounded shadow-none px-1 py-2"
                                placeholder="Contact Number"
                                name="contact_number"
                                value={ziaratFormData.contact_number}
                                onChange={handleZiaratInputChange}
                              />
                            </div>

                            {/* Price */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Price *
                              </label>
                              <input
                                type="number"
                                className="form-control rounded shadow-none px-1 py-2"
                                placeholder="Price"
                                name="price"
                                value={ziaratFormData.price}
                                onChange={handleZiaratInputChange}
                                min="0"
                              />
                            </div>

                            {/* Status */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Status
                              </label>
                              <div className="d-flex align-items-center mt-2">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="ziaratStatusSwitch"
                                    checked={ziaratFormData.status === "active"}
                                    onChange={(e) => {
                                      setZiaratFormData({
                                        ...ziaratFormData,
                                        status: e.target.checked ? "active" : "inactive"
                                      });
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor="ziaratStatusSwitch">
                                    {ziaratFormData.status === "active" ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Minimum Persons */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Minimum Persons
                              </label>
                              <input
                                type="number"
                                className="form-control rounded shadow-none px-1 py-2"
                                placeholder="Min Persons"
                                name="min_pex"
                                value={ziaratFormData.min_pex}
                                onChange={handleZiaratInputChange}
                                min="0"
                              />
                            </div>

                            {/* Maximum Persons */}
                            <div className="col-md-2">
                              <label htmlFor="" className="Control-label">
                                Maximum Persons
                              </label>
                              <input
                                type="number"
                                className="form-control rounded shadow-none px-1 py-2"
                                placeholder="Max Persons"
                                name="max_pex"
                                value={ziaratFormData.max_pex}
                                onChange={handleZiaratInputChange}
                                min="0"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex align-items-end col-md-4 gap-2 mb-4">
                              <button
                                className="btn btn-primary"
                                onClick={handleSaveZiarat}
                                disabled={
                                  isSavingZiarat ||
                                  !ziaratFormData.ziarat_title ||
                                  !ziaratFormData.contact_person ||
                                  !ziaratFormData.contact_number ||
                                  !ziaratFormData.price
                                }
                              >
                                {isSavingZiarat ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    {editingZiaratId ? "Updating..." : "Saving..."}
                                  </>
                                ) : editingZiaratId ? (
                                  "Update Ziarat Price"
                                ) : (
                                  "Add Ziarat Price"
                                )}
                              </button>

                              {(editingZiaratId || ziaratFormData.ziarat_title) && (
                                <button
                                  className="btn btn-secondary"
                                  onClick={resetZiaratForm}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Ziarat Prices Dropdown Select */}
                          <div className="mb-4 col-md-3 align-items-center gap-2 d-flex">
                            <div>
                              <label htmlFor="" className="Control-label">
                                Select Ziarat Price
                              </label>
                              <select
                                className="form-select shadow-none"
                                value={editingZiaratId || ""}
                                onChange={(e) => {
                                  const ziaratId = e.target.value;
                                  if (ziaratId) {
                                    const selectedZiarat = ziaratPrices.find(
                                      (z) => z.id.toString() === ziaratId
                                    );
                                    if (selectedZiarat) {
                                      handleEditZiarat(selectedZiarat);
                                    }
                                  } else {
                                    resetZiaratForm();
                                  }
                                }}
                              >
                                <option value="">Create New Ziarat Price</option>
                                {ziaratPrices.map((ziarat) => (
                                  <option key={ziarat.id} value={ziarat.id}>
                                    {ziarat.ziarat_title} {ziarat.city ? `- ${ziarat.city.name}` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Delete Button for Selected Ziarat */}
                            <div>
                              {editingZiaratId && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this ziarat price?")) {
                                      handleDeleteZiarat(editingZiaratId);
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Common Sections (8-10) */}
                    {/* 8 */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <h4 className="fw-bold mb-3">
                          Flight name, iata code and logo
                        </h4>
                        <div className="col-12 d-flex flex-wrap gap-3">
                          {/* Select Flight to Edit */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              Select Flight
                            </label>
                            <select
                              className="form-select"
                              value={editingFlightId || ""}
                              onChange={(e) => {
                                const flightId = e.target.value;
                                setEditingFlightId(flightId || null);
                                if (flightId) {
                                  const selectedFlight = flights.find(
                                    (f) => f.id.toString() === flightId
                                  );
                                  if (selectedFlight) {
                                    setFlightName(selectedFlight.name);
                                    setFlightCode(selectedFlight.code);
                                    // For logo, you might need to fetch it separately or handle differently
                                  }
                                } else {
                                  setFlightName("");
                                  setFlightCode("");
                                  setFlightLogo(null);
                                }
                              }}
                            >
                              <option value="">Add New Flight</option>
                              {flights.map((flight) => (
                                <option key={flight.id} value={flight.id}>
                                  {flight.name} ({flight.code})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Flight Name */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              Flight Name
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Saudia Airline"
                              value={flightName}
                              onChange={(e) => setFlightName(e.target.value)}
                            />
                          </div>

                          {/* Flight Code */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              Flight Code
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="SV"
                              value={flightCode}
                              onChange={(e) => setFlightCode(e.target.value)}
                            />
                          </div>

                          {/* Logo Upload */}
                          <div className="d-flex align-items-end mb-3">
                            <input
                              type="file"
                              id="flightLogo"
                              className="d-none"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                            <label
                              htmlFor="flightLogo"
                              className="btn btn-outline-primary px-2 py-1 mb-0"
                            >
                              {flightLogo ? "Logo Selected" : "Select Logo"}
                            </label>
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex align-items-end gap-2 mb-3">
                            {!isEditingFlight && (
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  if (editingFlightId) {
                                    setIsEditingFlight(true);
                                  } else {
                                    handleAddFlight();
                                  }
                                }}
                                disabled={!flightName || !flightCode}
                              >
                                {editingFlightId ? "Edit" : "Add Flight"}
                              </button>
                            )}

                            {isEditingFlight && (
                              <>
                                <button
                                  className="btn btn-primary px-3 py-2"
                                  onClick={handleUpdateFlight} // You'll need to implement this
                                  disabled={isAddingFlight}
                                >
                                  {isAddingFlight
                                    ? "Updating..."
                                    : "Update Flight"}
                                </button>
                                <button
                                  className="btn btn-outline-secondary px-3 py-2"
                                  onClick={() => setIsEditingFlight(false)}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {editingFlightId && !isEditingFlight && (
                              <button
                                className="btn btn-danger px-3 py-2"
                                onClick={() => setShowDeleteFlightModal(true)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 9 */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <h4 className="fw-bold mb-3">City name, iata code</h4>
                        <div className="col-12 d-flex flex-wrap gap-3">
                          {/* Select City to Edit */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              Select City
                            </label>
                            <select
                              className="form-select"
                              value={editingCityId || ""}
                              onChange={(e) => {
                                const cityId = e.target.value;
                                setEditingCityId(cityId || null);
                                if (cityId) {
                                  const selectedCity = cities.find(
                                    (c) => c.id.toString() === cityId
                                  );
                                  if (selectedCity) {
                                    setCityName(selectedCity.name);
                                    setCityCode(selectedCity.code);
                                  }
                                } else {
                                  setCityName("");
                                  setCityCode("");
                                }
                              }}
                            >
                              <option value="">Add New City</option>
                              {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                  {city.name} ({city.code})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* City Name */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              City Name
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Lahore"
                              value={cityName}
                              onChange={(e) => setCityName(e.target.value)}
                            />
                          </div>

                          {/* City Code */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              City Code
                            </label>
                            <input
                              type="text"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Lhe"
                              value={cityCode}
                              onChange={(e) => setCityCode(e.target.value)}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex align-items-center gap-2 mb-3">
                            {!isEditingCity && (
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  if (editingCityId) {
                                    setIsEditingCity(true);
                                  } else {
                                    handleAddCity();
                                  }
                                }}
                                disabled={!cityName || !cityCode}
                              >
                                {editingCityId ? "Edit" : "Add City"}
                              </button>
                            )}

                            {isEditingCity && (
                              <>
                                <button
                                  className="btn btn-primary px-3 py-2"
                                  onClick={handleUpdateCity} // You'll need to implement this
                                  disabled={isAddingCity}
                                >
                                  {isAddingCity ? "Updating..." : "Update City"}
                                </button>
                                <button
                                  className="btn btn-outline-secondary px-3 py-2"
                                  onClick={() => setIsEditingCity(false)}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {editingCityId && !isEditingCity && (
                              <button
                                className="btn btn-danger px-3 py-2"
                                onClick={() => setShowDeleteCityModal(true)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 10 */}
                    <div className="p-lg-4 pt-4">
                      <div className="row">
                        <h4 className="fw-bold mb-3">
                          Set time for booking expire
                        </h4>
                        <div className="col-12 d-flex flex-wrap gap-3">
                          {/* Group Tickets Expiry */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              Expiry for Group tickets (hours)
                            </label>
                            <input
                              type="number"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Write Time Hrs"
                              value={groupExpiry}
                              onChange={(e) => setGroupExpiry(e.target.value)}
                            />
                          </div>

                          {/* Umrah Expiry */}
                          <div>
                            <label htmlFor="" className="Control-label">
                              Expiry for Umrah (hours)
                            </label>
                            <input
                              type="number"
                              className="form-control rounded shadow-none  px-1 py-2"
                              placeholder="Write Time Hrs"
                              value={umrahExpiry}
                              onChange={(e) => setUmrahExpiry(e.target.value)}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex align-items-center gap-2 mb-3">
                            {!isEditingExpiry && (
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => setIsEditingExpiry(true)}
                                disabled={!groupExpiry || !umrahExpiry}
                              >
                                Edit
                              </button>
                            )}

                            {isEditingExpiry && (
                              <>
                                <button
                                  className="btn btn-primary px-3 py-2"
                                  onClick={handleSetExpiry}
                                  disabled={isSettingExpiry}
                                >
                                  {isSettingExpiry
                                    ? "Saving..."
                                    : "Save Changes"}
                                </button>
                                <button
                                  className="btn btn-outline-secondary px-3 py-2"
                                  onClick={() => setIsEditingExpiry(false)}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <AdminFooter />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modals */}
        <DeleteShirkaModal />
        <DeleteSectorModal /> {/* Make sure this is included */}
        <DeleteTransportModal />
        <DeleteTransportType2Modal />
        <DeleteVisaModal />
        <DeleteFlightModal />
        <DeleteCityModal />
      </div>
    </>
  );
};

export default Visa;
