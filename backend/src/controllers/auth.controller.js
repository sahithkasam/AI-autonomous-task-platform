import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email, and password are required', 400);
  if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  res.status(201).json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, preferences: user.preferences } });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, preferences: user.preferences, stats: user.stats } });
};

export const getMe = async (req, res) => res.json({ success: true, user: req.user });

export const updateMe = async (req, res) => {
  const { name, preferences } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new AppError('Current password is wrong', 401);
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
};
