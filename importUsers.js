const xlsx = require('xlsx');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');

let userModel = require('./schemas/users');
let roleModel = require('./schemas/roles');

function generateRandomPassword(length = 16) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function sendEmailWithPassword(toEmail, username, password) {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "c6b8bff5bf3b4c",
      pass: "f2c51b9a5ce560"
    }
  });

  const mailOptions = {
    from: '"NNPTUD-C5" <noreply@nnptud-c5.com>',
    to: toEmail,
    subject: 'Your Account Password',
    html: `
      <h2>Welcome to NNPTUD-C5!</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Your account has been created. Here are your login credentials:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please keep this password secure and change it after your first login.</p>
      <br>
      <p>Best regards,<br>NNPTUD-C5 Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${toEmail}`);
}

async function importUsersFromExcel(filePath) {
  try {
    await mongoose.connect('mongodb+srv://nguyendanh9991:%40Danh2004@cluster0.k43ky4q.mongodb.net/test');
    console.log('Connected to MongoDB');

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const users = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${users.length} users in Excel file`);

    let userRole = await roleModel.findOne({ name: 'user' });
    if (!userRole) {
      userRole = await roleModel.create({ name: 'user', description: 'Regular user role' });
      console.log('Created user role');
    }

    for (const userData of users) {
      const username = userData.username;
      const email = userData.email;

      if (!username || !email) {
        console.log(`Skipping row - missing username or email:`, userData);
        continue;
      }

      const existingUser = await userModel.findOne({
        $or: [{ username: username }, { email: email }]
      });

      if (existingUser) {
        console.log(`User ${username} or email ${email} already exists, skipping...`);
        continue;
      }

      const password = generateRandomPassword(16);

      const newUser = new userModel({
        username: username,
        email: email,
        password: password,
        role: userRole._id,
        status: true
      });

      await newUser.save();
      console.log(`Created user: ${username} with email: ${email}`);

      try {
        await sendEmailWithPassword(email, username, password);
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError.message);
      }
    }

    console.log('Import completed!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

const excelFilePath = process.argv[2] || path.join(__dirname, 'user.xlsx');
importUsersFromExcel(excelFilePath);
