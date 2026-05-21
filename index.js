require('dotenv').config();
const axios = require("axios");
const {getChat} = require("./helper/wa");

// Mengambil API Key dari environment variable atau placeholder
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";
console.log(OPENAI_API_KEY);

async function analisisPercakapan(chatId, konteks = "") {
    // Validasi kunci API sebelum melakukan pemanggilan


    const url = process.env.OPENAI_API_BASE_URL+"/v1/chat/completions";

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
    };
    let messages = await getChat(chatId);

    const payload = {
        model: "openai/gpt-oss-20b", // Menggunakan model modern hemat biaya
        messages: [
            {
                role: "system",
                content: `Anda adalah AI Analis Data Percakapan yang ahli. Tugas Anda adalah menganalisis riwayat percakapan yang diberikan berdasarkan. analisa timestamp terbaru. ${konteks} 
Ekstrak informasi berikut ke dalam format JSON:
- tujuan: Target akhir atau apa yang ingin dicapai .
- konteks: Konteks riwayat percakapan.
- permasalahan: Kendala utama, error, atau kebingungan yang dihadapi oleh user.
- status: Apakah masalah selesai? jika belum selesai = false, jika sudah selesai = true.
- penyelesaian: jika permasalahan belum jelas atau konteks tidak jelas = false jika sudah jelas = true.
- feedback: Feedback yang dapat berikan petanyaan followup jika penyelesaian = 0 jika penyelesaian = 1 beri jawaban null.`

            },
            {
                role: "user",
                // Mengirimkan riwayat percakapan terformat sebagai JSON String
                content: `Berikut adalah percakapan yang harus dianalisis:\n${JSON.stringify(messages, null, 2)}`
            }
        ],
        // Memaksa model mengembalikan JSON terstruktur
        response_format: { type: "json_object" },
        temperature: 0.2 // Konsistensi hasil tinggi
    };

    try {
        console.log(JSON.stringify(payload, null, 2));
        const response = await axios.post(url, payload, { headers });
        console.log(response.data.choices[0].message);
        // Hasil generate text dari model berada di path response.data.choices[0].message.content
        const stringHasilMurni = cleanAndParseMalformedJson(response.data.choices[0].message.content);
        
        console.log(stringHasilMurni);
        // let jsonHasil = JSON.parse(stringHasilMurni);
        // console.log(jsonHasil);
        // return jsonHasil;
        

        // // Melakukan parsing string JSON tersebut kembali menjadi object Javascript
        // return JSON.parse(stringHasilMurni);
    } catch (error) {
        // Menangkap detail error spesifik dari Axios / HTTP response
        if (error.response) {
            throw new Error(`OpenAI API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        } else {
            throw new Error(`Kesalahan Koneksi: ${error.message}`);
        }
    }
}

analisisPercakapan('182222644580447@lid')
    .then((hasil) => {
        console.log("Hasil Analisis Berhasil Diterima:\n", JSON.stringify(hasil, null, 2));
    })
    .catch((err) => {
        console.error(err);
        console.error("Gagal melakukan analisis:", err.message);
    });


function cleanAndParseMalformedJson(rawStr) {
    let clean = rawStr.replace(/^```[a-zA-Z]*\s*/, "")
    .replace(/^\s*\{\s*\{/, '{')

        // 2. Membersihkan enter, spasi, atau kutip berlebih SEBELUM nama key
        // Format seperti: " \n "\n\ntujuan"  => "tujuan"
        .replace(/"[\s\n]*"[\s\n]*([a-zA-Z0-9_]+)"/g, '"$1"')

        // 3. Membersihkan enter/spasi berlebih di dalam kutipan key biasa
        // Format seperti: "\n\nkonteks"      => "konteks"
        .replace(/"[\s\n]*([a-zA-Z0-9_]+)"/g, '"$1"');
    try {
        // console.log(clean);
        let json = JSON.parse(clean);
        return JSON.parse(clean);
    } catch (error) {
        console.error("Gagal parsing JSON setelah dibersihkan. Cek hasil clean string:", clean);
        throw error;
    }
}
// cleanAndParseMalformedJson("```{\n{\" \n \"\n\ntujuan\": \" Mengajukan cuti bersama pada tanggal 15 Mei 2026 setelah melewati batas waktu \",\n \"\n\nkonteks\": \" Percakapan antara Riyanti Destiana (pengguna) dan Fakhri (penerima) mengenai pengajuan cuti bersama. Riyanti lupa mengajukan cuti sebelum deadline dan meminta bantuan. Fakhri kemudian mengirimkan pemberitahuan cuti back‑dated. Riyanti mengonfirmasi penerimaan pesan. \",\n \"\n\npermasalahan\": \" Riyanti lupa mengajukan cuti bersama sebelum batas waktu, sehingga membutuhkan bantuan untuk mengajukan cuti setelah melewati deadline. \",\n \"\n\nstatus\": true ,\n \"\n\npenyelesaian\": 1 ,\n \"\n\nfeedback\": null\n} ")