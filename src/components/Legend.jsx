const Legend = () => (
  <div className="legend">
    <div className="legend-item"><span className="box green"></span> Completed</div>
    <div className="legend-item"><span className="box orange"></span> Uncompleted (Need Edit)</div>
    <div className="legend-item"><span className="box red"></span> Not Started / Overdue</div>
  </div>
);
export default Legend;