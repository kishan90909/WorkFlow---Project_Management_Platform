import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";
import path from "node:path";
import { accessibleTask } from "./taskController.js";
import { notifyUser } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  legacyUploadsDirectory,
  uploadsDirectory,
  isSafeStoredFilename,
} from "../config/uploadPaths.js";

export const listComments = asyncHandler(async (req, res) => {
  await accessibleTask(req.params.id, req.user);
  const comments = await Comment.find({ task: req.params.id })
    .populate("author", "name email avatar")
    .sort({ createdAt: 1 });
  res.json({ success: true, data: { comments } });
});
export const createComment = asyncHandler(async (req, res) => {
  const { task, project } = await accessibleTask(req.params.id, req.user);
  const comment = await Comment.create({
    task: task._id,
    author: req.user._id,
    message: req.body.message,
  });
  const populated = await Comment.findById(comment._id).populate(
    "author",
    "name email avatar",
  );
  const recipients = new Set([
    project.manager.toString(),
    ...project.members.map((id) => id.toString()),
  ]);
  recipients.delete(req.user.id);
  await Promise.all(
    [...recipients].map((recipient) =>
      notifyUser({
        recipient,
        actor: req.user._id,
        type: "comment_added",
        title: "New task comment",
        message: `${req.user.name}: ${req.body.message.slice(0, 100)}`,
        resourceId: task._id,
      }),
    ),
  );
  res.status(201).json({ success: true, data: { comment: populated } });
});
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found.");
  await accessibleTask(comment.task, req.user);
  if (comment.author.toString() !== req.user.id && req.user.role !== "admin")
    throw new ApiError(403, "You cannot delete this comment.");
  await comment.deleteOne();
  res.json({ success: true, message: "Comment deleted." });
});
export const listAttachments = asyncHandler(async (req, res) => {
  await accessibleTask(req.params.id, req.user);
  const attachments = await Attachment.find({ task: req.params.id })
    .populate("uploadedBy", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { attachments } });
});
export const uploadAttachment = asyncHandler(async (req, res) => {
  const { task } = await accessibleTask(req.params.id, req.user);
  if (!req.file) throw new ApiError(400, "Choose a file to upload.");
  const attachment = await Attachment.create({
    task: task._id,
    uploadedBy: req.user._id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
  res.status(201).json({ success: true, data: { attachment } });
});
export const deleteAttachment = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.attachmentId);
  if (!attachment) throw new ApiError(404, "Attachment not found.");
  await accessibleTask(attachment.task, req.user);
  if (
    attachment.uploadedBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  )
    throw new ApiError(403, "You cannot delete this attachment.");
  const fs = await import("node:fs/promises");
  if (isSafeStoredFilename(attachment.storedName)) {
    await Promise.all(
      [uploadsDirectory, legacyUploadsDirectory].map((directory) =>
        fs.unlink(path.join(directory, attachment.storedName)).catch(() => {}),
      ),
    );
  }
  await attachment.deleteOne();
  res.json({ success: true, message: "Attachment deleted." });
});

export const downloadAttachment = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findOne({
    _id: req.params.attachmentId,
    task: req.params.id,
  });
  if (!attachment) throw new ApiError(404, "Attachment not found.");
  await accessibleTask(req.params.id, req.user);
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  if (!isSafeStoredFilename(attachment.storedName))
    throw new ApiError(400, "Invalid attachment file reference.");

  const candidates = [uploadsDirectory, legacyUploadsDirectory];
  let filePath = null;
  for (const directory of candidates) {
    const candidate = path.join(directory, attachment.storedName);
    try {
      await fs.access(candidate);
      filePath = candidate;
      break;
    } catch {
      // Try the legacy directory before returning a not-found response.
    }
  }
  if (!filePath)
    throw new ApiError(
      404,
      "Attachment file is missing from storage. Please upload it again.",
    );

  res.download(filePath, attachment.originalName, (error) => {
    if (error && !res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Unable to download attachment." });
    }
  });
});
