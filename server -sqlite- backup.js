const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files from current directory

// Initialize SQLite database
let db;
function initializeDatabase() {
  db = new sqlite3.Database('./school.db', (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      
      // Create tables if they don't exist
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          dateOfBirth TEXT,
          gender TEXT,
          address TEXT,
          parentName TEXT,
          parentContact TEXT,
          class TEXT,
          admissionDate TEXT,
          createdAt TEXT
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS teachers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT UNIQUE,
          password TEXT,
          subject TEXT,
          classAssigned TEXT,
          createdAt TEXT
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          createdAt TEXT
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS performance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER,
          subject TEXT,
          term TEXT,
          score INTEGER,
          grade TEXT,
          teacherId INTEGER,
          createdAt TEXT,
          FOREIGN KEY (studentId) REFERENCES students (id),
          FOREIGN KEY (teacherId) REFERENCES teachers (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS fees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER,
          totalAmount REAL,
          amountPaid REAL,
          balance REAL,
          paymentDate TEXT,
          createdAt TEXT,
          FOREIGN KEY (studentId) REFERENCES students (id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          senderId INTEGER,
          senderType TEXT,
          recipientId INTEGER,
          subject TEXT,
          content TEXT,
          createdAt TEXT
        )`);
        
        // Insert default admin if not exists
        db.get("SELECT * FROM admins WHERE username = ?", ['admin'], (err, row) => {
          if (!row) {
            db.run("INSERT INTO admins (username, password, createdAt) VALUES (?, ?, ?)", 
              ['admin', 'admin123', new Date().toISOString()]);
          }
        });
        
        // Insert default teacher if not exists
        db.get("SELECT * FROM teachers WHERE email = ?", ['teacher@example.com'], (err, row) => {
          if (!row) {
            db.run("INSERT INTO teachers (firstName, lastName, email, password, subject, classAssigned, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)", 
              ['John', 'Doe', 'teacher@example.com', 'teacher123', 'Mathematics', 'P.1', new Date().toISOString()]);
          }
        });
      });
    }
  });
}

initializeDatabase();

// API Routes

// Student Registration
app.post('/api/students/register', (req, res) => {
  const { firstName, lastName, dateOfBirth, gender, address, parentName, parentContact, class: studentClass } = req.body;
  
  const stmt = db.prepare("INSERT INTO students (firstName, lastName, dateOfBirth, gender, address, parentName, parentContact, class, admissionDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  stmt.run([
    firstName, 
    lastName, 
    dateOfBirth, 
    gender, 
    address, 
    parentName, 
    parentContact, 
    studentClass, 
    new Date().toISOString(), 
    new Date().toISOString()
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Initialize fees record for the student
    const feesStmt = db.prepare("INSERT INTO fees (studentId, totalAmount, amountPaid, balance, createdAt) VALUES (?, ?, ?, ?, ?)");
    feesStmt.run([this.lastID, 0, 0, 0, new Date().toISOString()], function(feesErr) {
      if (feesErr) {
        console.error('Error creating fees record:', feesErr.message);
      }
    });
    
    res.json({
      id: this.lastID,
      message: 'Student registered successfully'
    });
  });
  stmt.finalize();
});

// Get all students
app.get('/api/students', (req, res) => {
  db.all("SELECT * FROM students ORDER BY firstName, lastName", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get student by ID
app.get('/api/students/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM students WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json(row);
  });
});

// Get student by name and class (for parent login)
app.get('/api/students/by-name-class', (req, res) => {
  const { name, class: className } = req.query;
  
  if (!name || !className) {
    res.status(400).json({ error: 'Name and class are required' });
    return;
  }
  
  // Split name into first and last name
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  
  // Search for student by first name, last name, and class
  db.get("SELECT * FROM students WHERE firstName = ? AND lastName = ? AND class = ?", [firstName, lastName, className], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      // Try with just first name if full name didn't work
      db.get("SELECT * FROM students WHERE firstName = ? AND class = ?", [firstName, className], (err2, row2) => {
        if (err2) {
          res.status(500).json({ error: err2.message });
          return;
        }
        if (!row2) {
          res.status(404).json({ error: 'Student not found' });
          return;
        }
        res.json(row2);
      });
    } else {
      res.json(row);
    }
  });
});

// Delete student by ID
app.delete('/api/students/:id', (req, res) => {
  const id = req.params.id;
  
  // First delete related performance records
  db.run("DELETE FROM performance WHERE studentId = ?", [id], (perfErr) => {
    if (perfErr) {
      res.status(500).json({ error: perfErr.message });
      return;
    }
    
    // Then delete related fees records
    db.run("DELETE FROM fees WHERE studentId = ?", [id], (feesErr) => {
      if (feesErr) {
        res.status(500).json({ error: feesErr.message });
        return;
      }
      
      // Finally delete the student
      db.run("DELETE FROM students WHERE id = ?", [id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Student not found' });
          return;
        }
        res.json({ message: 'Student deleted successfully' });
      });
    });
  });
});

// Admin Login
app.post('/api/admins/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple authentication for demo
  if (username === 'admin' && password === 'admin123') {
    res.json({
      id: 1,
      username: username
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Teacher Login
app.post('/api/teachers/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple authentication for demo - in a real system, you would hash and compare passwords
  db.get("SELECT id, firstName, lastName, email, subject, classAssigned FROM teachers WHERE email = ?", [email], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // For demo purposes, we'll accept any password
    // In a real system, you would check the hashed password
    res.json({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      subject: row.subject,
      classAssigned: row.classAssigned
    });
  });
});

// Get teacher by ID
app.get('/api/teachers/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM teachers WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    res.json(row);
  });
});

// Add new teacher (Admin only)
app.post('/api/teachers/add', (req, res) => {
  const { firstName, lastName, email, password, subject, classAssigned } = req.body;
  
  const stmt = db.prepare("INSERT INTO teachers (firstName, lastName, email, password, subject, classAssigned, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
  stmt.run([
    firstName,
    lastName,
    email,
    password,
    subject,
    classAssigned,
    new Date().toISOString()
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      message: 'Teacher added successfully'
    });
  });
  stmt.finalize();
});

// Get all teachers
app.get('/api/teachers', (req, res) => {
  db.all("SELECT id, firstName, lastName, email, subject, classAssigned FROM teachers ORDER BY firstName, lastName", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update teacher details (Admin only)
app.put('/api/teachers/:id', (req, res) => {
    const teacherId = req.params.id;
    const { firstName, lastName, email, subject, classAssigned } = req.body;
    
    // Build dynamic update query based on provided fields
    let updates = [];
    let values = [];
    
    if (firstName !== undefined) {
        updates.push("firstName = ?");
        values.push(firstName);
    }
    if (lastName !== undefined) {
        updates.push("lastName = ?");
        values.push(lastName);
    }
    if (email !== undefined) {
        updates.push("email = ?");
        values.push(email);
    }
    if (subject !== undefined) {
        updates.push("subject = ?");
        values.push(subject);
    }
    if (classAssigned !== undefined) {
        updates.push("classAssigned = ?");
        values.push(classAssigned);
    }
    
    // If no fields to update, return error
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
    }
    
    // Add teacherId to values for WHERE clause
    values.push(teacherId);
    
    const query = `UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`;
    
    const stmt = db.prepare(query);
    stmt.run(values, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Teacher not found' });
            return;
        }
        res.json({
            message: 'Teacher updated successfully'
        });
    });
    stmt.finalize();
});

// Delete teacher by ID (Admin only)
app.delete('/api/teachers/:id', (req, res) => {
    const id = req.params.id;
    
    db.run("DELETE FROM teachers WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Teacher not found' });
            return;
        }
        res.json({ message: 'Teacher deleted successfully' });
    });
});

// Add student performance
app.post('/api/performance/add', (req, res) => {
  const { studentId, subject, term, score, grade, teacherId } = req.body;
  
  const stmt = db.prepare("INSERT INTO performance (studentId, subject, term, score, grade, teacherId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
  stmt.run([
    studentId, 
    subject, 
    term, 
    score, 
    grade, 
    teacherId, 
    new Date().toISOString()
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      message: 'Performance recorded successfully'
    });
  });
  stmt.finalize();
});

// Get student performance
app.get('/api/performance/student/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  db.all("SELECT * FROM performance WHERE studentId = ? ORDER BY createdAt DESC", [studentId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Send message
app.post('/api/messages/send', (req, res) => {
  const { senderId, senderType, recipientId, subject, content } = req.body;
  
  const stmt = db.prepare("INSERT INTO messages (senderId, senderType, recipientId, subject, content, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run([
    senderId,
    senderType,
    recipientId,
    subject,
    content,
    new Date().toISOString()
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      message: 'Message sent successfully'
    });
  });
  stmt.finalize();
});

// Get messages for a teacher
app.get('/api/messages/teacher/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  db.all("SELECT * FROM messages WHERE recipientId = ? ORDER BY createdAt DESC", [teacherId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get all classes with student count
app.get('/api/classes', (req, res) => {
  // First get all existing classes with student counts
  db.all(`
    SELECT class, COUNT(*) as studentCount 
    FROM students 
    GROUP BY class 
    ORDER BY class
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Define all possible classes
    const allClasses = [
      'Baby Class', 'Middle Class', 'Top Class',
      'P.1', 'P.2', 'P.3', 'P.4', 'P.5', 'P.6', 'P.7'
    ];
    
    // Create result array with all classes
    const result = allClasses.map(className => {
      const found = rows.find(row => row.class === className);
      return {
        class: className,
        studentCount: found ? found.studentCount : 0
      };
    });
    
    res.json(result);
  });
});

// Get students by class
app.get('/api/classes/:className/students', (req, res) => {
  const className = req.params.className;
  db.all("SELECT * FROM students WHERE class = ? ORDER BY firstName, lastName", [className], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get class performance summary
app.get('/api/classes/:className/performance', (req, res) => {
  const className = req.params.className;
  
  db.all(`
    SELECT p.*, s.firstName, s.lastName 
    FROM performance p 
    JOIN students s ON p.studentId = s.id 
    WHERE s.class = ? 
    ORDER BY s.firstName, s.lastName, p.createdAt DESC
  `, [className], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update fees
app.post('/api/fees/update', (req, res) => {
  const { studentId, totalAmount, amountPaid } = req.body;
  const balance = totalAmount - amountPaid;
  
  // Check if student already has a fees record
  db.get("SELECT * FROM fees WHERE studentId = ?", [studentId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      // Update existing record
      db.run("UPDATE fees SET totalAmount = ?, amountPaid = ?, balance = ?, paymentDate = ? WHERE studentId = ?", 
        [totalAmount, amountPaid, balance, new Date().toISOString(), studentId], function(updateErr) {
          if (updateErr) {
            res.status(500).json({ error: updateErr.message });
            return;
          }
          res.json({ message: 'Fees updated successfully' });
        });
    } else {
      // Create new record
      const stmt = db.prepare("INSERT INTO fees (studentId, totalAmount, amountPaid, balance, paymentDate, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
      stmt.run([
        studentId, 
        totalAmount, 
        amountPaid, 
        balance, 
        new Date().toISOString(), 
        new Date().toISOString()
      ], function(insertErr) {
        if (insertErr) {
          res.status(500).json({ error: insertErr.message });
          return;
        }
        res.json({ message: 'Fees recorded successfully' });
      });
      stmt.finalize();
    }
  });
});

// Get student fees
app.get('/api/fees/student/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  db.get("SELECT * FROM fees WHERE studentId = ?", [studentId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Get all fees records
app.get('/api/fees/all', (req, res) => {
  db.all(`
    SELECT f.*, s.firstName, s.lastName, s.class 
    FROM fees f 
    JOIN students s ON f.studentId = s.id 
    ORDER BY s.class, s.firstName, s.lastName
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;