// Google Apps Script untuk menerima data tamu dari aplikasi e-Guestbook
// dan menyimpannya ke Spreadsheet.
//
// Cara pakai:
// 1. Buka Spreadsheet Anda (kolom: nik, nama, alamat, keperluan, foto).
// 2. Extensions -> Apps Script, lalu tempel isi file ini.
// 3. Deploy -> New deployment -> Web app:
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Salin URL deployment, lalu isi SHEETS_API_URL di src/config.js.

// (Opsional) ID folder Google Drive untuk menyimpan foto selfie.
// Kosongkan agar foto disimpan di root Drive.
const DRIVE_FOLDER_ID = ''

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)

    const nik = data.nik || ''
    const nama = data.nama || ''
    const alamat = data.alamat || ''
    const keperluan = data.keperluan || ''
    let fotoUrl = ''

    // Simpan foto selfie ke Google Drive (jika ada) dan ambil tautannya.
    if (data.foto) {
      const folder = DRIVE_FOLDER_ID
        ? DriveApp.getFolderById(DRIVE_FOLDER_ID)
        : DriveApp.getRootFolder()

      const blob = Utilities.newBlob(
        Utilities.base64Decode(data.foto),
        'image/jpeg',
        'selfie_' + Date.now() + '.jpg',
      )
      const file = folder.createFile(blob)
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
      fotoUrl = file.getUrl()
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
    sheet.appendRow([nik, nama, alamat, keperluan, fotoUrl])

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok' }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: String(error) }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

// Respon sederhana untuk pengecekan manual.
function doGet(e) {
  return ContentService.createTextOutput('e-Guestbook Apps Script OK').setMimeType(
    ContentService.MimeType.TEXT,
  )
}
