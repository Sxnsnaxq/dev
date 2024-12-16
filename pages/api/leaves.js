import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // รหัสผ่าน MySQL
  database: 'leave_system', // ชื่อฐานข้อมูล
};

export default async function handler(req, res) {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    // POST: เพิ่มข้อมูลคำขอลา
    if (req.method === 'POST') {
      const { fullName, departmentPosition, email, phoneNumber, leaveType, leaveReason, startDate, endDate } = req.body;

      if (!fullName || !departmentPosition || !email || !phoneNumber || !leaveType || !leaveReason || !startDate || !endDate) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      if (start < today) {
        return res.status(400).json({ message: 'ไม่อนุญาตให้บันทึกวันลาย้อนหลัง' });
      }

      const [result] = await connection.execute(
        `INSERT INTO leaverequests 
          (full_name, department_position, email, phone_number, leave_type, leave_reason, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullName, departmentPosition, email, phoneNumber, leaveType, leaveReason, startDate, endDate]
      );

      return res.status(201).json({ message: 'บันทึกข้อมูลสำเร็จ', id: result.insertId });

    // GET: ดึงข้อมูลทั้งหมด
    } else if (req.method === 'GET') {
      const [rows] = await connection.execute(
        `SELECT * FROM leaverequests ORDER BY record_date DESC`
      );
      return res.status(200).json(rows);

    // DELETE: ลบข้อมูลตาม ID
    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ต้องระบุ ID สำหรับการลบ' });
      }

      await connection.execute(`DELETE FROM leaverequests WHERE id = ?`, [id]);
      return res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });

    // PUT: อัปเดตข้อมูลตาม ID
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const { fullName, phoneNumber, leaveType, leaveReason, startDate, endDate } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'ต้องระบุ ID สำหรับการแก้ไข' });
      }

      if (!fullName || !phoneNumber || !leaveType || !leaveReason || !startDate || !endDate) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      }

      await connection.execute(
        `UPDATE leaverequests 
         SET full_name, department_position, email, phone_number, leave_type, leave_reason, start_date, end_date
         WHERE id = ?`,
        [fullName, phoneNumber, leaveType, leaveReason, startDate, endDate, id]
      );

      return res.status(200).json({ message: 'แก้ไขข้อมูลสำเร็จ' });

    // Unsupported method
    } else {
      res.setHeader('Allow', ['POST', 'GET', 'DELETE', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ', error: error.message });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
