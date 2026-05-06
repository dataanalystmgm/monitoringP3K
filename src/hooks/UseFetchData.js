import { useState, useEffect } from 'react';

const useFetchData = (url) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal mengambil data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh otomatis setiap 5 menit (opsional)
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [url]);

  return { data, loading, error };
};

export default useFetchData;