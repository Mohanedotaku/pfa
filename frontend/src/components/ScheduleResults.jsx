import React from "react";

const ScheduleResults = ({
  onViewAssignments,
  onExportSchedule,
  onRegenerateSchedule,
}) => {
  return (
    <div className="schedule-result-section">
      <div className="result-header">
        <h3>Schedule Generated Successfully!</h3>
        <p>Your exam schedule has been created and is ready for review.</p>
      </div>

      <div className="schedule-actions">
        <button className="view-button" onClick={onViewAssignments}>
          View Assignments
        </button>
        <button className="export-button" onClick={onExportSchedule}>
          Export Schedule
        </button>
        <button className="regenerate-button" onClick={onRegenerateSchedule}>
          Regenerate Schedule
        </button>
      </div>

      <div className="schedule-preview">
        <div className="preview-header">
          <h4>Schedule Preview</h4>
          <p>A high-level overview of your generated exam schedule</p>
        </div>
        <div className="placeholder-message">
          Detailed schedule information will be displayed here based on the
          backend data. This will include exam dates, assigned rooms, and
          teacher allocations.
        </div>
      </div>
    </div>
  );
};

export default ScheduleResults;
