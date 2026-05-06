import React, { useState } from 'react';
import Swal from 'sweetalert2';

const ChecklistForm = ({ onSubmit, onCancel }) => {
  const [stationId, setStationId] = useState('');
  
  // Daftar item berdasarkan gambar yang Anda kirimkan
  const [items, setItems] = useState([
    { name: "Kasa Steril terbungkus", value: "Ada", hasExpiry: true, expiry: "" },
    { name: "Perban ( lebar 5 cm )", value: "Ada", hasExpiry: false },
    { name: "Perban ( lebar 10 cm )", value: "Ada", hasExpiry: false },
    { name: "Plester Roll lebar ( 1.25 cm )", value: "Ada", hasExpiry: true, expiry: "" },
    { name: "Plester Cepat / Hansaplast", value: "Ada", hasExpiry: false },
    { name: "Kapas ( 25 gram )", value: "Ada", hasExpiry: false },
    { name: "Kain Segitiga / Mitela", value: "Ada", hasExpiry: false },
    { name: "Gunting", value: "Ada", hasExpiry: false },
    { name: "Peniti", value: "Ada", hasExpiry: false },
    { name: "Sarung tangan sekali pakai ( Handscoon )", value: "Ada", hasExpiry: false },
    { name: "Masker", value: "Ada", hasExpiry: false },
    { name: "Pinset", value: "Ada", hasExpiry: false },
    { name: "Lampu senter", value: "Ada", hasExpiry: false },
    { name: "Gelas untuk cuci mata", value: "Ada", hasExpiry: false },
    { name: "Kantong plastik bersih", value: "Ada", hasExpiry: false },
    { name: "Revanol", value: "Ada", hasExpiry: true, expiry: "" },
    { name: "Povidion lodin ( 60 ml )", value: "Ada", hasExpiry: true, expiry: "" },
    { name: "Alkohol 70%", value: "Ada", hasExpiry: true, expiry: "" },
    { name: "Buku Panduan P3K", value: "Ada", hasExpiry: false },
    { name: "Aquades (100 ml)/ Y-RINS", value: "Ada", hasExpiry: true, expiry: "" },
    { name: "Daftar Isi Kotak", value: "Ada", hasExpiry: false }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stationId) {
      Swal.fire('Error', 'Silahkan pilih nomor Station', 'error');
      return;
    }
    
    // Kirim data ke fungsi di App.jsx
    onSubmit({
      stationId: parseInt(stationId),
      items: items.map(i => ({ name: i.name, value: i.value, expiry: i.expiry }))
    });
  };

  return (
    <div className="form-container animate-pop">
      <div className="form-card">
        <div className="form-header gradient-bg">
          <h2>Form Checklist P3K Baru</h2>
          <p>Input pengecekan barang hari ini</p>
        </div>

        <form onSubmit={handleSubmit} className="form-body">
          <div className="input-group">
            <label>Nomor Station (1-40)</label>
            <input 
              type="number" 
              min="1" 
              max="40" 
              className="modern-input"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              placeholder="Contoh: 5"
              required
            />
          </div>

          <div className="items-scroll-area">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Item Nama</th>
                  <th>Ketersediaan</th>
                  <th>Expired Date (Jika Perlu)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>
                      <select 
                        className="modern-select"
                        value={item.value}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].value = e.target.value;
                          setItems(newItems);
                        }}
                      >
                        <option value="Ada">Ada</option>
                        <option value="Tidak Ada">Tidak Ada</option>
                      </select>
                    </td>
                    <td>
                      {item.hasExpiry && (
                        <input 
                          type="date" 
                          className="date-input"
                          value={item.expiry}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].expiry = e.target.value;
                            setItems(newItems);
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Laporan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChecklistForm;