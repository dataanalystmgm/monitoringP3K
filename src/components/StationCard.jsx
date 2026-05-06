// p3k_project/src/components/StationCard.jsx
import React from 'react';

const StationCard = ({ id, status, isValidated, onClick }) => {
  return (
    <div className={`station-card ${status} ${isValidated ? 'validated-border' : ''}`} onClick={onClick}>
      <div className="station-number">{id.toString().padStart(2, '0')}</div>
      <div className="station-label">KOTAK P3K</div>
      <div className="status-badge">
        {status === 'red' ? 'NOT STARTED' : status === 'green' ? 'COMPLETED' : 'UNCOMPLETED'}
      </div>
      {isValidated && status === 'green' && (
        <div className="validated-badge">VALIDATED ✓</div>
      )}
    </div>
  );
};

export default StationCard;