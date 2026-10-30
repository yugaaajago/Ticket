import { fmtDuration, fmtLong } from './lib.js'

// Ganti sesuai nama perusahaan / tim
export const COMPANY = 'AppleWifi'

export const RFO_TYPES = [
  { value: 'pelanggan', label: 'Pelanggan' },
  { value: 'mitra', label: 'Mitra' },
  { value: 'sekolah', label: 'Sekolah' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function buildRfo(type, t) {
  const start = fmtLong(t.incident_at) || '(isi waktu kejadian)'
  const end = t.status === 'selesai' && t.closed_at ? fmtLong(t.closed_at) : '(belum pulih)'
  const dur = (t.status === 'selesai' && fmtDuration(t.incident_at, t.closed_at)) || '-'
  const cause = t.cause?.trim() || '(isi penyebab)'
  const action = t.action?.trim() || '(isi tindakan perbaikan)'
  const handler = t.waiting_on
    ? `${t.waiting_on}${t.waiting_name ? ` (${t.waiting_name})` : ''}`
    : '-'

  if (type === 'mitra') {
    return `*RFO - LAPORAN GANGGUAN*

Kepada Yth. Rekan Mitra ${t.site},
${greeting()}. Berikut ringkasan penanganan gangguan:

• *Site/Mitra* : ${t.site}
• *Case* : ${t.title}
• *Mulai gangguan* : ${start}
• *Layanan pulih* : ${end}
• *Durasi* : ${dur}
• *Penanganan* : ${handler}
• *Root cause* : ${cause}
• *Corrective action* : ${action}
• *Status* : ${t.status === 'selesai' ? 'Closed - layanan normal' : 'Dalam penanganan'}

Mohon konfirmasi apabila layanan sudah normal di sisi Bapak/Ibu. Terima kasih atas kerja samanya.

NOC ${COMPANY}`
  }

  if (type === 'sekolah') {
    return `${greeting()}, Bapak/Ibu pengelola ${t.site}.

Kami dari ${COMPANY} menyampaikan informasi penanganan gangguan internet di sekolah.

*Gangguan* : ${t.title}
*Mulai* : ${start}
*Internet kembali normal* : ${end}
*Lama gangguan* : ${dur}

*Penyebab*
${cause}

*Yang sudah kami lakukan*
${action}

Mohon maaf apabila kegiatan belajar mengajar sempat terganggu. Jika masih ada kendala, silakan kabari kami kapan saja. Terima kasih atas pengertian Bapak/Ibu 🙏

Salam,
Tim ${COMPANY}`
  }

  // pelanggan
  return `${greeting()} Bapak/Ibu,

Kami dari ${COMPANY} menginformasikan hasil penanganan gangguan layanan internet Anda.

*RFO (Reason For Outage)*
Lokasi/Pelanggan : ${t.site}
Waktu gangguan : ${start}
Waktu pulih : ${end}
Durasi : ${dur}
Penyebab : ${cause}
Tindakan : ${action}

${t.status === 'selesai' ? 'Layanan Anda sudah normal kembali.' : 'Saat ini gangguan masih dalam penanganan.'} Mohon maaf atas ketidaknyamanannya. Jika masih ada kendala, silakan hubungi kami kembali. Terima kasih atas pengertiannya 🙏

Salam,
NOC ${COMPANY}`
}
