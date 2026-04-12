import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/shared/validation';

import { ContactService } from './contact.service';
import { ContactSubmissionDto } from './dto/contact-submission.dto';

@ApiTags('Contact')
@Controller('contacto')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Enviar mensaje desde el formulario de contacto del sitio web' })
  async submit(@Body() body: ContactSubmissionDto) {
    return this.contactService.submitContact(body);
  }
}
