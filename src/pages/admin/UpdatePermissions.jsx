import React, { useState, useEffect, useRef, useCallback } from "react";
import Select from "react-select";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminFooter from "../../components/AdminFooter";

const ShimmerLoader = () => {
  return (
    <div className="py-3">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="shimmer-line mb-2"
          style={{
            height: "20px",
            width: "100%",
            borderRadius: "4px",
            background:
              "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        ></div>
      ))}
    </div>
  );
};

const UpdateGroupPermissions = () => {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [permissionSections, setPermissionSections] = useState([]);
  const [permissionNameMap, setPermissionNameMap] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [groupPermissions, setGroupPermissions] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [allGroupPermissions, setAllGroupPermissions] = useState({});

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Fetch all permissions once when component mounts
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication token not available");

        const permsRes = await axios.get(
          "http://127.0.0.1:8000/api/permissions/",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const allPerms = permsRes.data;
        setAllPermissions(allPerms);

        const nameMap = {};
        allPerms.forEach((perm) => {
          nameMap[perm.codename] = perm.name;
        });
        setPermissionNameMap(nameMap);

        const grouped = allPerms.reduce((acc, perm) => {
          let panel = "Uncategorized";
          if (typeof perm.content_type === "string" && perm.content_type) {
            const parts = perm.content_type.split("|");
            panel =
              parts.length >= 2 ? parts[1].trim() : perm.content_type.trim();
          } else if (
            perm.content_type &&
            typeof perm.content_type === "object"
          ) {
            panel = perm.content_type.model || "Uncategorized";
          }
          if (!acc[panel]) acc[panel] = [];
          acc[panel].push(perm.codename);
          return acc;
        }, {});

        const sections = Object.keys(grouped)
          .sort()
          .map((panel) => ({
            id: panel,
            title:
              panel === "Uncategorized"
                ? "Uncategorized"
                : panel
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" "),
            permissions: grouped[panel].sort(),
          }));
        setPermissionSections(sections);
      } catch (err) {
        console.error("Error fetching permissions:", err);
        toast.error("Failed to load permissions");
      }
    };

    fetchPermissions();
  }, []);

  // Fetch groups and their permissions with organization-specific caching
  useEffect(() => {
    const fetchGroupsAndPermissions = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Authentication token not available");

        const storedOrg = JSON.parse(
          localStorage.getItem("selectedOrganization")
        );
        const orgId = storedOrg ? storedOrg.id : null;

        // Create org-specific cache keys
        const cacheKey = orgId ? `cachedGroups_${orgId}` : `cachedGroups`;
        const permissionsCacheKey = orgId 
          ? `allGroupPermissions_${orgId}` 
          : `allGroupPermissions`;
        const timestampKey = orgId
          ? `cachedGroupsTimestamp_${orgId}`
          : `cachedGroupsTimestamp`;
        const oneHourAgo = new Date().getTime() - 60 * 60 * 1000;

        const cachedGroups = localStorage.getItem(cacheKey);
        const cachedPermissions = localStorage.getItem(permissionsCacheKey);
        const cachedTimestamp = localStorage.getItem(timestampKey);

        // If we have cached data that's not expired, use it
        if (cachedGroups && cachedPermissions && cachedTimestamp && cachedTimestamp > oneHourAgo) {
          setGroups(JSON.parse(cachedGroups));
          setAllGroupPermissions(JSON.parse(cachedPermissions));
          return;
        }

        // Fetch fresh data
        const [groupsRes, permsRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/groups/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/api/permissions/", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        // Filter groups by organization
        const filteredGroups = orgId
          ? groupsRes.data.filter(
              (group) => group.extended?.organization === orgId
            )
          : groupsRes.data;

        setGroups(filteredGroups);

        // Fetch all groups' permissions in parallel
        const permissionsMap = {};
        const permissionRequests = filteredGroups.map(group => 
          axios.get(`http://127.0.0.1:8000/api/groups/${group.id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );

        const permissionResponses = await Promise.all(permissionRequests);
        
        permissionResponses.forEach((response, index) => {
          const groupId = filteredGroups[index].id;
          const permIDs = Array.isArray(response.data.permissions)
            ? response.data.permissions
            : [];

          // Convert IDs to codenames
          const perms = permsRes.data
            .filter((p) => permIDs.includes(p.id))
            .map((p) => p.codename);

          permissionsMap[groupId] = perms;
        });

        setAllGroupPermissions(permissionsMap);

        // Cache all data
        localStorage.setItem(cacheKey, JSON.stringify(filteredGroups));
        localStorage.setItem(permissionsCacheKey, JSON.stringify(permissionsMap));
        localStorage.setItem(timestampKey, new Date().getTime());
      } catch (err) {
        console.error("Error fetching groups and permissions:", err);
        toast.error("Failed to load groups and permissions");
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };

    fetchGroupsAndPermissions();
  }, []);

  // When selectedGroup changes, update groupPermissions from cache
  useEffect(() => {
    if (selectedGroup && allGroupPermissions[selectedGroup]) {
      setGroupPermissions(allGroupPermissions[selectedGroup]);
    } else {
      setGroupPermissions([]);
    }
  }, [selectedGroup, allGroupPermissions]);

  // Update permissions state when groupPermissions or permissionSections change
  useEffect(() => {
    if (!permissionSections.length) return;

    const initial = {};
    permissionSections.forEach((section) => {
      initial[section.id] = {};
      section.permissions.forEach((perm) => {
        initial[section.id][perm] = groupPermissions.includes(perm);
      });
    });

    setPermissions(initial);
  }, [groupPermissions, permissionSections]);

  const handlePermissionChange = (sectionId, perm) => {
    setPermissions((prev) => {
      const newValue = !prev[sectionId][perm];

      setGroupPermissions((prevCodenames) => {
        let newCodenames;
        if (newValue) {
          newCodenames = [...prevCodenames, perm];
        } else {
          newCodenames = prevCodenames.filter((c) => c !== perm);
        }

        // Update in-memory cache
        if (selectedGroup) {
          setAllGroupPermissions(prev => ({
            ...prev,
            [selectedGroup]: newCodenames
          }));
        }

        return newCodenames;
      });

      return {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [perm]: newValue,
        },
      };
    });
  };

  const handleUpdatePermissions = async () => {
    if (!selectedGroup) {
      toast.error("Please select a group first");
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication token not available");

      const res = await axios.get(
        `http://127.0.0.1:8000/api/groups/${selectedGroup}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const groupData = res.data;

      const selectedIDs = allPermissions
        .filter((p) => groupPermissions.includes(p.codename))
        .map((p) => p.id);

      const payload = {
        name: groupData.name,
        extended: groupData.extended,
        permissions: selectedIDs,
      };

      await axios.patch(
        `http://127.0.0.1:8000/api/groups/${selectedGroup}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update localStorage cache
      const storedOrg = JSON.parse(localStorage.getItem("selectedOrganization"));
      const orgId = storedOrg ? storedOrg.id : null;
      const cacheKey = orgId ? `cachedGroups_${orgId}` : `cachedGroups`;
      const permissionsCacheKey = orgId 
        ? `allGroupPermissions_${orgId}` 
        : `allGroupPermissions`;
      const timestampKey = orgId
        ? `cachedGroupsTimestamp_${orgId}`
        : `cachedGroupsTimestamp`;

      // Update the allGroupPermissions cache
      const cachedPermissions = JSON.parse(localStorage.getItem(permissionsCacheKey)) || {};
      cachedPermissions[selectedGroup] = groupPermissions;
      localStorage.setItem(permissionsCacheKey, JSON.stringify(cachedPermissions));

      // Update timestamp to extend cache validity
      localStorage.setItem(timestampKey, new Date().getTime());

      toast.success("Permissions updated successfully!");
    } catch (err) {
      console.error("Error updating permissions:", err.response?.data || err);
      toast.error("Failed to update permissions");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Prepare options for react-select
  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));

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
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .shimmer-line {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
        `}
      </style>
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
            <div className="px-3 px-lg-4 my-3">
              {/* Navigation Tabs */}
              <div className="row ">
              <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                <nav className="nav flex-wrap gap-2">
                  {tabs.map((tab, idx) => (
                    <NavLink
                      key={idx}
                      to={tab.path}
                      className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${
                        tab.name === "Group And Permissions"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                      }`}
                      style={{ backgroundColor: "transparent" }}
                    >
                      {tab.name}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
            <div className="p-3 my-3 bg-white shadow-sm rounded-3">
              <div>
                <div className="d-flex justify-content-between align-items-center py-3">
                  <h4 className="mb-0 fw-bold">Update Group Permissions</h4>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleUpdatePermissions}
                      disabled={!selectedGroup || isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </button>
                    <Link
                      to="/admin/partners/role-permissions"
                      className="btn btn-primary"
                    >
                      Groups
                    </Link>
                  </div>
                </div>

                {isLoading ? (
                  <ShimmerLoader />
                ) : (
                  <div className="p-4">
                    <div className="mb-4 row">
                      <div className="col-md-4">
                        <fieldset className="border border-black w-100 p-2 rounded mb-3">
                          <legend className="float-none w-auto px-1 fs-6">
                            Groups
                          </legend>
                          <Select
                            options={groupOptions}
                            value={groupOptions.find(
                              (option) => option.value === selectedGroup
                            )}
                            onChange={(selected) =>
                              setSelectedGroup(selected?.value || "")
                            }
                            placeholder="Select Group"
                            isSearchable={true}
                            styles={{
                              control: (base) => ({
                                ...base,
                                border: "none",
                                boxShadow: "none",
                                "&:hover": {
                                  border: "none",
                                },
                              }),
                            }}
                          />
                        </fieldset>
                      </div>
                    </div>
                    {permissionSections.length > 0 ? (
                      permissionSections.map((section) => (
                        <div key={section.id} className="mb-4">
                          <h5 className="text-muted mb-3">{section.title}</h5>
                          <div className="d-flex flex-wrap gap-4">
                            {section.permissions.map((perm) => (
                              <div
                                className="form-check"
                                key={`${section.id}-${perm}`}
                              >
                                <input
                                  className="form-check-input border border-black"
                                  type="checkbox"
                                  checked={
                                    permissions?.[section.id]?.[perm] || false
                                  }
                                  onChange={() =>
                                    handlePermissionChange(section.id, perm)
                                  }
                                  id={`${section.id}-${perm}`}
                                />
                                <label
                                  className="form-check-label text-muted"
                                  htmlFor={`${section.id}-${perm}`}
                                >
                                  {permissionNameMap[perm] || perm}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p>No permissions found</p>
                      </div>
                    )}
                  </div>
                )}
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
    </>
  );
};

export default UpdateGroupPermissions;