import {
  BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post,
  Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { RecordsService } from './records.service';
import { CreateRecordDto, UpdateRecordDto } from './dto';
import { CurrentUser, JwtUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMETYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

@ApiTags('records')
@ApiBearerAuth()
@Controller('records')
export class RecordsController {
  constructor(private records: RecordsService) {}

  @Get()
  @Roles(Role.PATIENT, Role.DOCTOR)
  @ApiOperation({ summary: 'List visit records (patient: own; doctor: own patients)' })
  @ApiQuery({ name: 'patientId', required: false })
  list(@CurrentUser() user: JwtUser, @Query('patientId') patientId?: string) {
    return this.records.list(user, patientId);
  }

  @Get(':id')
  @Roles(Role.PATIENT, Role.DOCTOR)
  @ApiOperation({ summary: 'Get a visit record' })
  getOne(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.records.getOne(user, id);
  }

  @Post()
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Create a visit record (SOAP note) for an appointment' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateRecordDto) {
    return this.records.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Update / finalize a SOAP note (pre-auth enforced for specialists)' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecordDto,
  ) {
    return this.records.update(user, id, dto);
  }

  @Post(':id/files')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Upload a lab result (PDF/PNG/JPEG, max 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
      }),
      limits: { fileSize: MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('Only PDF, PNG or JPEG allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.records.attachFile(user, id, file);
  }

  @Get(':id/files/:fileId')
  @Roles(Role.PATIENT, Role.DOCTOR)
  @ApiOperation({ summary: 'Download a lab file' })
  async downloadFile(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() res: Response,
  ) {
    const { file, absolute } = await this.records.getFile(user, id, fileId);
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    fs.createReadStream(absolute).pipe(res);
  }
}
