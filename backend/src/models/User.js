import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  preferences: { theme: { type: String, default: 'dark' }, notifications: { type: Boolean, default: true } },
  stats: { totalTasks: { type: Number, default: 0 }, completedTasks: { type: Number, default: 0 }, totalTokensUsed: { type: Number, default: 0 } },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
}, { timestamps: true });
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function(p) { return bcrypt.compare(p, this.password); };
userSchema.methods.toJSON = function() { const o = this.toObject(); delete o.password; return o; };
export default mongoose.model('User', userSchema);
