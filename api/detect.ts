import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import FormData from 'form-data';
import formidable from 'formidable';
import fs from 'fs';

// ✅ ปิด Body Parser ของ Vercel เพื่อให้ formidable จัดการไฟล์เอง
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // รับเฉพาะ Method POST เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = formidable();

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ success: false, message: "Form parsing error" });
        return resolve(true);
      }

      try {
        // ดึงไฟล์จากฟอร์ม (รองรับทั้งแบบ array และ single file)
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
          res.status(400).json({ success: false, message: "No file uploaded" });
          return resolve(true);
        }

        // ✅ เตรียมสร้าง FormData เพื่อยิงต่อไปยัง FastAPI Backend ของพี่
        const aiFormData = new FormData();
        
        // อ่านไฟล์จาก Temporary Path ที่ formidable เก็บไว้
        const fileStream = fs.createReadStream(file.filepath);
        
        aiFormData.append('file', fileStream, {
          filename: file.originalFilename || 'upload.jpg',
          contentType: file.mimetype || 'image/jpeg',
        });

        // ✅ ยิงไปที่ URL ของ FastAPI (Render หรือ Server ของพี่)
        // ใช้ URL จาก Env หรือใส่ตรงๆ ตามที่พี่ตั้งค่าไว้
        const backendUrl = process.env.VITE_API_URL || 'https://banana-deploy.onrender.com';
        
        const response = await axios.post(`${backendUrl}/detect`, aiFormData, {
          headers: {
            ...aiFormData.getHeaders(),
          },
          timeout: 30000, // กันเหนียวเผื่อ Server AI หลับ (30 วินาที)
        });

        // ส่งผลลัพธ์กลับไปให้ Frontend (Index.tsx)
        res.status(200).json(response.data);
        resolve(true);

      } catch (error: any) {
        console.error('Proxy Error:', error.message);
        res.status(500).json({ 
          success: false, 
          message: "AI Server connection failed",
          error: error.message 
        });
        resolve(true);
      }
    });
  });
}
