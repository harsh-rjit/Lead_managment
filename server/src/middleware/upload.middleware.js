import multer from 'multer';
import path from 'path';
import AppError from '../utils/AppError.js';

/**
 * Configure Multer with memory storage
 * Prevents writing unneeded temporary files to disk and allows streaming buffer parsing
 */
const storage = multer.memoryStorage();

/**
 * Strict file filter accepting CSV files only
 * Checks both file extension and MIME type
 */
const csvFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = [
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/csv',
    'text/x-csv',
    'application/octet-stream', // Some browsers send CSV as octet-stream
  ];

  if (ext !== '.csv') {
    return cb(
      new AppError('Invalid file type. Only CSV files (.csv) are supported.', 400),
      false
    );
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new AppError(
        `Invalid file MIME type (${file.mimetype}). Please upload a valid CSV file.`,
        400
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only single file upload
  },
  fileFilter: csvFileFilter,
});

/**
 * Express middleware wrapper for single CSV file upload
 * Catches Multer-specific error codes (e.g., LIMIT_FILE_SIZE) and forwards as clean AppErrors
 */
export const uploadCSV = (fieldName = 'file') => {
  const uploadSingle = upload.single(fieldName);

  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(
              new AppError('File size limit exceeded. Maximum allowed CSV size is 5MB.', 400)
            );
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(
              new AppError(`Unexpected form field. Please upload using field name '${fieldName}'.`, 400)
            );
          }
          return next(new AppError(`File upload error: ${err.message}`, 400));
        }
        return next(err);
      }
      next();
    });
  };
};

export default uploadCSV;
