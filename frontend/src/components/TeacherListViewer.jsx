import { useState, useEffect } from "react";
// Import test data for development purposes
import testTeachersData from "../test/response_teachers.json";

/**
 * Component to display teacher list data based on backend model:
 * TeacherInfo {
 *   fullName: string,
 *   grade: string,
 *   hourlyLoad: number
 * }
 */
const TeacherListViewer = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null); // Keep error state for UI conditions but don't need setter
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch teachers from backend or use test data
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        // TEMPORARILY USING TEST DATA ONLY
        // Comment out the actual API call for now
        /*
        const response = await axios.get("http://localhost:5271/all-teachers");
        
        if (response.data) {
          // If the backend returns an array directly
          if (Array.isArray(response.data)) {
            setTeachers(response.data);
          } 
          // If the backend returns an object with a teachers property
          else if (response.data.teachers) {
            setTeachers(response.data.teachers);
          } 
          // For testing with the local JSON file
          else {
            setTeachers(testTeachersData);
          }
        } else {
          setTeachers([]);
        }
        */

        // Always use test data for now
        console.log("Using test data from response_teachers.json");
        setTeachers(testTeachersData);
      } catch (error) {
        console.error("Error:", error);

        // Always fallback to test data
        console.log("Using test data from response_teachers.json");
        setTeachers(testTeachersData);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="list-viewer-container">
      <div className="list-header">
        <h2>Teacher List</h2>
        <p>View all registered teachers in the system</p>
      </div>

      {/* Search bar */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search teachers by name or grade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Loading, error and empty states */}
      {loading && <div className="loading-state">Loading teachers...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && teachers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👩‍🏫</div>
          <h3>No Teachers Available</h3>
          <p>
            No teacher data has been uploaded yet. Please upload a teacher list
            file first.
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        teachers.length > 0 &&
        filteredTeachers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Results Found</h3>
            <p>
              No teachers match your search query. Try using different keywords.
            </p>
          </div>
        )}

      {/* Data source indicator */}
      {!loading && teachers.length > 0 && (
        <div
          className="list-info"
          style={{ marginBottom: "1rem", textAlign: "left", color: "#666" }}
        >
          <strong>Note:</strong> Displaying sample teacher data from test file
        </div>
      )}

      {/* Teacher list */}
      {!loading && filteredTeachers.length > 0 && (
        <div className="list-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Grade</th>
                <th>Hourly Load</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher, index) => (
                <tr key={index}>
                  <td className="teacher-name">{teacher.fullName || "N/A"}</td>
                  <td>{teacher.grade || "N/A"}</td>
                  <td>
                    {teacher.hourlyLoad !== undefined
                      ? teacher.hourlyLoad
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredTeachers.length > 0 && (
        <div className="list-info">
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </div>
      )}
    </div>
  );
};

export default TeacherListViewer;
