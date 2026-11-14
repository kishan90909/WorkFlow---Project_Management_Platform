import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Comment from '../models/Comment.js';
import Attachment from '../models/Attachment.js';

const models = [User, Team, Project, Task, Notification, AuditLog, Comment, Attachment];
try {
  await connectDatabase();
  for (const model of models) {
    await model.createIndexes();
    console.log(`Indexes ensured: ${model.modelName}`);
  }
} catch (error) {
  console.error('Failed to create database indexes:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
