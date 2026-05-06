function doGet() {
  const ssId = "1j9KCnTPaS7yHSdUlfLuCkWk0eeMYQ9Bw0MNWXeEmVfk";
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName("Form Responses 1");
  const data = sheet.getDataRange().getValues();
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const results = rows.map(row => {
    const stationRaw = String(row[3]); // Kolom D: KOTAK P3K
    const stationId = parseInt(stationRaw.substring(0, 2)); // Ambil 2 digit awal
    
    let isComplete = true;
    for (let i = 4; i < headers.length; i++) {
      const headerName = headers[i];
      // Abaikan kolom Expired[cite: 1]
      if (!headerName.toLowerCase().includes("expired") && 
          !["Timestamp", "NIK MGM", "NAMA PIC", "KOTAK P3K"].includes(headerName)) {
        if (row[i] !== "Ada") { // Ceklis oke jika berisi kata "Ada"[cite: 1]
          isComplete = false;
          break;
        }
      }
    }
    
    return {
      timestamp: row[0],
      stationId: stationId,
      isComplete: isComplete
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}