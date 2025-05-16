const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

// Define file size limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Create file filter for acceptable file types
const fileFilter = (req, file, cb) => {
  // Accept images and small videos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, MP4, PDF, and Word documents are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  },
  fileFilter
});

/**
 * Middleware to handle file uploads to Supabase Storage
 * @param {string} bucketName - Name of the bucket to store files in
 * @returns {Function} - Express middleware function
 */
const handleFileUpload = (bucketName) => {
  return async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        // No files uploaded, just proceed
        return next();
      }
      
      const uploadPromises = req.files.map(async (file) => {
        // Generate a unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        
        // Determine folder based on file type
        let folder = 'other';
        if (file.mimetype.startsWith('image/')) {
          folder = 'images';
        } else if (file.mimetype.startsWith('video/')) {
          folder = 'videos';
        } else if (file.mimetype.startsWith('application/pdf') || 
                   file.mimetype.startsWith('application/msword') ||
                   file.mimetype.startsWith('application/vnd.openxmlformats-officedocument')) {
          folder = 'documents';
        }
        
        const filePath = `${folder}/${fileName}`;
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });
        
        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }
        
        // Get public URL of uploaded file
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        return {
          originalName: file.originalname,
          fileName,
          filePath,
          fileType: file.mimetype,
          fileSize: file.size,
          publicUrl: urlData.publicUrl
        };
      });
      
      // Execute all upload promises
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Add uploaded files to request
      req.uploadedFiles = uploadedFiles;
      next();
    } catch (error) {
      console.error('File upload error:', error);
      res.status(400).json({ error: error.message || 'File upload failed' });
    }
  };
};

/**
 * Middleware to handle single image upload
 */
const uploadImage = (fieldName) => {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file) {
          // No file uploaded, just proceed
          return next();
        }
        
        // Generate a unique filename
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = `images/${fileName}`;
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });
        
        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }
        
        // Get public URL of uploaded file
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);
        
        // Add uploaded file URL to request
        req.fileUrl = urlData.publicUrl;
        next();
      } catch (error) {
        console.error('Image upload error:', error);
        res.status(400).json({ error: error.message || 'Image upload failed' });
      }
    }
  ];
};

/**
 * Middleware to handle multiple file uploads
 */
const uploadFiles = (fieldName) => {
  return [
    upload.array(fieldName, MAX_FILES),
    handleFileUpload('uploads')
  ];
};

module.exports = {
  uploadImage,
  uploadFiles
};
