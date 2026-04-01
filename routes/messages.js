const express = require('express');
const router = express.Router();
const Message = require('../schemas/messages');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Middleware giả định cho checkLogin
const jwt = require('jsonwebtoken');
const checkLogin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = { _id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /messages/:userID - Lấy toàn bộ message giữa current user và userID
router.get('/:userID', checkLogin, async (req, res) => {
  const currentUser = req.user._id;
  const userID = req.params.userID;
  try {
    const messages = await Message.find({
      $or: [
        { from: currentUser, to: userID },
        { from: userID, to: currentUser }
      ]
    }).sort({ createdAt: 1 }).populate('from to');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /messages/:userID - Gửi message đến userID
router.post('/:userID', checkLogin, upload.single('file'), async (req, res) => {
  const { type, text } = req.body;
  const from = req.user._id;
  const to = req.params.userID;
  let messageText = text;
  if (type === 'file' && req.file) {
    messageText = req.file.path;
  }
  try {
    const message = new Message({
      from,
      to,
      messageContent: { type, text: messageText }
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /messages - Lấy message cuối cùng với mỗi user
router.get('/', checkLogin, async (req, res) => {
  const currentUser = req.user._id;
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { from: currentUser },
            { to: currentUser }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$from', currentUser] },
              then: '$to',
              else: '$from'
            }
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);
    res.json(messages.map(m => m.lastMessage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;