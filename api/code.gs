// p3k_project/code.gs

function doGet() {
  const ssId = "1j9KCnTPaS7yHSdUlfLuCkWk0eeMYQ9Bw0MNWXeEmVfk";
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName("Form Responses 1");
  const data = sheet.getDataRange().getValues();
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const results = rows.map(row => {
    const stationRaw = String(row[3]); // Ambil isi Kolom D asli (misal: "01 Lobby")
    
    // Variabel 1: stationId tetap angka murni (misal: 1)
    const stationId = parseInt(stationRaw.substring(0, 2)); 
    
    // Variabel 2: locationName hanya mengambil teks setelah angka (misal: "Lobby")
    // Kita bersihkan angka 2 digit dan spasi di depannya
    const locationName = stationRaw.replace(/^\d{2}\s*/, '') || "KOTAK P3K";
    
    let isComplete = true;
    const items = [];

    for (let i = 4; i < 31; i++) {
      const headerName = headers[i];
      if (headerName && !headerName.toLowerCase().includes("expired")) {
        const value = row[i];
        items.push({ name: headerName, value: value });
        if (value !== "Ada") isComplete = false; 
      }
    }

    console.log("Raw: " + stationRaw + " -> Location: " + locationName);
    
    return {
      timestamp: row[0],
      stationId: stationId,    // Digunakan untuk nomor ID (atas)
      locationName: locationName, // VARIABEL BARU untuk nama tempat
      isComplete: isComplete,
      items: items,
      validationStatus: row[31] || ""
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}

// Fungsi doPost tetap sama (menggunakan stationId angka untuk mencari baris)
function doPost(e) {
  const ssId = "1j9KCnTPaS7yHSdUlfLuCkWk0eeMYQ9Bw0MNWXeEmVfk";
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName("Form Responses 1");
  const params = JSON.parse(e.postData.contents);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let rowIndex = -1;
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  for (let i = 1; i < data.length; i++) {
    const rowDate = new Date(data[i][0]).toLocaleDateString('en-CA');
    const rowStation = parseInt(String(data[i][3]).substring(0, 2));
    
    if (rowDate === todayStr && rowStation === params.stationId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    if (params.action === "validate") {
      sheet.getRange(rowIndex, 32).setValue("validated");
    } else {
      params.updates.forEach(update => {
        const colIndex = headers.indexOf(update.name);
        if (colIndex !== -1) sheet.getRange(rowIndex, colIndex + 1).setValue(update.value);
      });
      sheet.getRange(rowIndex, 32).setValue("");
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({result: "error"})).setMimeType(ContentService.MimeType.JSON);
}