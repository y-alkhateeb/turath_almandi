import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/app-assets',
        filename: (req, file, callback) => {
          // Generate unique filename: timestamp-randomstring.ext
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
      fileFilter: (req, file, callback) => {
        // Only allow images
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/)) {
          return callback(new Error('Only image files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
