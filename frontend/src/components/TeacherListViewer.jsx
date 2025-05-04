import { useState, useEffect } from "react";
import axios from "axios"; // Ensure axios is imported

const TeacherListViewer = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Updated to use setter for error handling
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch teachers from the backend
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      setError(null); // Reset error state
      try {
        const response = await axios.get("http://localhost:5271/teachers");
        // Ensure the response data is an array
        const teachersData = Array.isArray(response.data) ? response.data : [];
        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setError("Failed to load teachers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []); // Empty dependency array means this runs once on component mount

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

      {/* Loading, error, and empty states */}
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

      {!loading && !error && teachers.length > 0 && filteredTeachers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>
            No teachers match your search query. Try using different keywords.
          </p>
        </div>
      )}

      {/* Teacher list */}
      {!loading && !error && filteredTeachers.length > 0 && (
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