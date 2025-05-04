import React from "react";

const TimetablePreview = ({ sessionsDayDate }) => {
  const { type, days, dates } = sessionsDayDate;

  // Format dates to a readable format (e.g., "2023-11-13")
  const formattedDates = dates.map((date) =>
    new Date(date).toLocaleDateString("en-CA") // Adjust format as needed
  );

  return (
    <div className="list-viewer-container">
      <div className="list-header">
        <h2>Timetable Preview ({type})</h2>
        <p>Preview of the exam session timetable</p>
      </div>

      <div className="timetable-meta">
        <div className="meta-item">
          <span className="meta-label">Nom:</span>
          <span className="meta-value">N/A</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Grade:</span>
          <span className="meta-value">N/A</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Type:</span>
          <span className="meta-value">{type}</span>
        </div>
      </div>

      <div className="list-table-container">
        <table className="excel-table">
          <thead>
            <tr>
              <th colSpan={2}></th> {/* Empty space above Jour and Date */}
              <th colSpan={4}>Horaire</th> {/* Spans S1 to S4 */}
            </tr>
            <tr>
              <th>Jour</th>
              <th>Date</th>
              <th>S1</th>
              <th>S2</th>
              <th>S3</th>
              <th>S4</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, index) => (
              <tr key={index}>
                <td>{day}</td>
                <td>{formattedDates[index]}</td>
                <td></td> {/* Empty time slot */}
                <td></td> {/* Empty time slot */}
                <td></td> {/* Empty time slot */}
                <td></td> {/* Empty time slot */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetablePreview;