import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import StationCard from './components/StationCard';
import Legend from './components/Legend';
import './index.css';

const App = () => {
  // --- 1. STATE MANAGEMENT ---
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [localItems, setLocalItems] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());

  const GAS_URL = "https://script.google.com/macros/s/AKfycbwDPTz3zeAGomZujIM2wNQJfbeB7uNf0UuEio3wD4JXLqjQo2cfKk4YqC4yyf0U6P7M/exec";

  // --- 2. DATA FETCHING ---
  const fetchData = (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    fetch(GAS_URL)
      .then(res => res.json())
      .then(data => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        if (!isAutoRefresh) Swal.fire('Error', 'Gagal sinkronisasi data', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 20000);
    return () => clearInterval(interval);
  }, []);

  // --- 3. HELPER LOGIC: STATUS CHECKER ---
  const getStationStatusByDate = (id, date) => {
    if (!Array.isArray(submissions)) return { color: 'red', validated: false };
    
    const targetDateStr = date.toLocaleDateString('en-CA');
    const logs = submissions.filter(s => {
      const sId = typeof s.stationId === 'string' 
        ? parseInt(s.stationId.replace(/\D/g, '')) 
        : s.stationId;
      return sId === id && new Date(s.timestamp).toLocaleDateString('en-CA') === targetDateStr;
    });

    if (logs.length === 0) return { color: 'red', validated: false };
    
    const latest = logs[logs.length - 1];
    return { 
      color: latest.isComplete ? 'green' : 'orange',
      validated: latest.validationStatus === 'validated'
    };
  };

  // --- 4. CALENDAR ANALYTICS LOGIC ---
  const getDayAnalytics = (date) => {
    const issues = { red: [], orange: [], yellow: [] };
    for (let i = 1; i <= 40; i++) {
      const status = getStationStatusByDate(i, date);
      if (status.color === 'red') issues.red.push(i);
      else if (status.color === 'orange') issues.orange.push(i);
      else if (status.color === 'green' && !status.validated) issues.yellow.push(i);
    }

    let bgColor = 'cal-green';
    let displayIssues = [];

    if (issues.red.length > 0) { bgColor = 'cal-red'; displayIssues = issues.red; }
    else if (issues.orange.length > 0) { bgColor = 'cal-orange'; displayIssues = issues.orange; }
    else if (issues.yellow.length > 0) { bgColor = 'cal-yellow'; displayIssues = issues.yellow; }

    return { bgColor, displayIssues };
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  // --- 5. SUMMARY SCORECARD LOGIC ---
  const summary = (() => {
    const stats = { notStarted: 0, uncompleted: 0, unvalidated: 0, validated: 0, total: 40 };
    const today = new Date();
    for (let i = 1; i <= stats.total; i++) {
      const status = getStationStatusByDate(i, today);
      if (status.color === 'red') stats.notStarted++;
      else if (status.color === 'orange') stats.uncompleted++;
      else if (status.color === 'green' && !status.validated) stats.unvalidated++;
      else if (status.color === 'green' && status.validated) stats.validated++;
    }
    return stats;
  })();

  const getPercent = (val) => ((val / summary.total) * 100).toFixed(1) + '%';

  // --- 6. EVENT HANDLERS ---
  const handleCardClick = (id) => {
    const statusObj = getStationStatusByDate(id, new Date());
    if (statusObj.color === 'red') {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Silahkan isi checklist hari ini terlebih dahulu!' });
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    const latestData = submissions.filter(s => {
      const sId = typeof s.stationId === 'string' ? parseInt(s.stationId.replace(/\D/g, '')) : s.stationId;
      return sId === id && new Date(s.timestamp).toLocaleDateString('en-CA') === todayStr;
    }).pop();

    if (!latestData) return;
    setSelectedStation({ id, status: statusObj.color, data: latestData });
    setLocalItems(latestData.items || []);
  };

  const handleSubmitEdit = async () => {
    Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'edit', stationId: selectedStation.id, updates: localItems })
      });
      const result = await response.json();
      if (result.result === 'success') {
        Swal.fire('Berhasil!', 'Data telah diperbarui.', 'success');
        fetchData(true);
        setSelectedStation(null);
      }
    } catch (e) { Swal.fire('Gagal', 'Terjadi kesalahan server.', 'error'); }
  };

  const handleValidate = async () => {
    const { value: password } = await Swal.fire({ title: 'Validasi Admin', input: 'password', showCancelButton: true });
    if (password === "admin") {
      Swal.fire({ title: 'Memproses...', didOpen: () => Swal.showLoading() });
      try {
        const response = await fetch(GAS_URL, { 
          method: 'POST', 
          body: JSON.stringify({ action: 'validate', stationId: selectedStation.id }) 
        });
        const result = await response.json();
        if (result.result === 'success') {
          Swal.fire('Validated!', 'Station berhasil divalidasi.', 'success');
          fetchData(true);
          setSelectedStation(null);
        }
      } catch (e) { Swal.fire('Gagal', 'Gagal memproses validasi.', 'error'); }
    } else if (password) {
      Swal.fire('Ditolak', 'Password salah!', 'error');
    }
  };

  // --- 7. RENDER VIEW ---
  return (
    <div className="dashboard-container full-width">
      <div className="tab-menu">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Real-time Dashboard</button>
        <button className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>History Calendar</button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          <header className="header-compact">
            <h1>Monitoring Kotak P3K - MGM</h1>
            <span className="refresh-tag">Auto-refresh: 20s</span>
          </header>

          <div className="summary-grid">
            <div className="scorecard sc-red">
              <div className="sc-label">Not Started</div>
              <div className="sc-value">{summary.notStarted}</div>
              <div className="sc-percent">{getPercent(summary.notStarted)}</div>
            </div>
            <div className="scorecard sc-orange">
              <div className="sc-label">Uncompleted</div>
              <div className="sc-value">{summary.uncompleted}</div>
              <div className="sc-percent">{getPercent(summary.uncompleted)}</div>
            </div>
            <div className="scorecard sc-yellow">
              <div className="sc-label">Unvalidated</div>
              <div className="sc-value">{summary.unvalidated}</div>
              <div className="sc-percent">{getPercent(summary.unvalidated)}</div>
            </div>
            <div className="scorecard sc-blue">
              <div className="sc-label">Validated</div>
              <div className="sc-value">{summary.validated}</div>
              <div className="sc-percent">{getPercent(summary.validated)}</div>
            </div>
          </div>

          <div className="legend-area"><Legend /></div>

          {loading && submissions.length === 0 ? (
            <div className="loading-spinner"><div className="spinner"></div><p>Sinkronisasi...</p></div>
          ) : (
            <div className="grid-layout-8col">
              {[...Array(40)].map((_, i) => {
                const id = i + 1;
                const status = getStationStatusByDate(id, new Date());
                
                // Cari data station (tanpa filter tanggal agar nama lokasi selalu muncul)
                // Cari data station untuk ekstraksi nama lokasi
                const stationInfo = submissions.find(s => {
                  const sId = typeof s.stationId === 'string' 
                    ? parseInt(s.stationId.replace(/\D/g, '')) 
                    : s.stationId;
                  return sId === id;
                });

                // LOGIKA BARU: Menghapus 2 digit angka di depan dan spasi setelahnya
                const locationName = stationInfo?.locationName || `STATION ${id}`

                return (
                  <StationCard 
                    key={id} 
                    id={id} 
                    location={locationName} // Sekarang akan mengirim "Lobby"
                    status={status.color} 
                    isValidated={status.validated} 
                    onClick={() => handleCardClick(id)} 
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="calendar-container animate-pop">
          <div className="calendar-header">
            <button className="btn-nav" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>◀ Prev</button>
            <h2>{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h2>
            <button className="btn-nav" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>Next ▶</button>
          </div>
          <div className="calendar-grid">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => <div key={day} className="cal-weekday">{day}</div>)}
            {getCalendarDays().map((date, idx) => {
              if (!date) return <div key={idx} className="cal-day empty"></div>;
              const { bgColor, displayIssues } = getDayAnalytics(date);
              return (
                <div key={idx} className={`cal-day ${bgColor}`}>
                  <span className="cal-date-num">{date.getDate()}</span>
                  <div className="cal-issue-list">
                    {displayIssues.length > 0 ? `ID: ${displayIssues.join(', ')}` : '✓ Clear'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedStation && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <div className="modal-header gradient-bg">
              <h2>Station {selectedStation.id.toString().padStart(2, '0')}</h2>
              <button className="close-x" onClick={() => setSelectedStation(null)}>&times;</button>
            </div>
            <div className="modal-body custom-scroll">
              <table className="styled-table">
                <thead><tr><th>Item Obat</th><th width="120">Status</th></tr></thead>
                <tbody>
                  {localItems.map((item, idx) => (
                    <tr key={idx} className={item.value !== 'Ada' ? 'row-alert' : ''}>
                      <td>{item.name}</td>
                      <td>
                        <select className="modern-select" value={item.value} onChange={(e) => {
                          const updated = [...localItems];
                          updated[idx].value = e.target.value;
                          setLocalItems(updated);
                        }}>
                          <option value="Ada">Ada</option>
                          <option value="Tidak Ada">Tidak Ada</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-modern btn-edit" onClick={handleSubmitEdit}>Submit Perubahan</button>
              {selectedStation.data.isComplete && selectedStation.data.validationStatus !== 'validated' && (
                <button className="btn-modern btn-validate" onClick={handleValidate}>Validate Now</button>
              )}
              {selectedStation.data.validationStatus === 'validated' && <div className="badge-validated">Validated ✓</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;