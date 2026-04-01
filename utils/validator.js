const { body, validationResult } = require('express-validator');

const validatedResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const CreateUserValidator = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').isEmail().withMessage('Invalid email'),
];

const ModifyUserValidator = [
  // Thêm nếu cần
];

const RegisterValidator = CreateUserValidator;

const ChangePasswordValidator = [
  body('oldPassword').exists(),
  body('newPassword').isLength({ min: 6 }),
];

module.exports = {
  validatedResult,
  CreateUserValidator,
  ModifyUserValidator,
  RegisterValidator,
  ChangePasswordValidator
};