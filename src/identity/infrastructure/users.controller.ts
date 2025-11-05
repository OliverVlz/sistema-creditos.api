import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Query,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/shared/validation';
import { UserRole } from 'src/shared/enums/user-role.enum';
import {
  AdminOrAdvisorGuard,
  AdminGuard,
  AdvisorGuard,
} from 'src/shared/guards';

import { CreateUserCommand } from '../application/create-user/create-user.command'; // Re-importado
import { LoginQuery } from '../application/login/login.query';
import { GetUsersQuery } from '../application/get-users/get-users.query';
import { CreateUserClientCommand } from '../application/create-user-client/create-user-client.command';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { User } from '../domain/user.model';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/sign-up')
  @Public()
  @ApiOperation({
    summary: 'Registro público de cliente (User + Client Info)',
    description:
      'Permite que cualquier persona se registre como CLIENT, creando su cuenta de usuario y su perfil de cliente en un solo flujo. No requiere autenticación.',
  })
  async signUpClient(@Body() body: CreateClientUserDto) {
    return this.commandBus.execute(
      new CreateUserClientCommand({
        ...body,
        role: UserRole.CLIENTE,
      }),
    );
  }

  @Post('/admin/staff')
  @ApiBearerAuth()
  //@UseGuards(AdminGuard) no eliminar comentario
  @Public()
  @ApiOperation({
    summary: 'Crear usuario staff (Advisor/Admin) - Solo ADMIN',
    description:
      'Permite a ADMIN crear usuarios con rol ADVISOR o ADMIN (personal interno). Para crear clientes usar POST /clients/register',
  })
  async createStaffUser(@Body() body: CreateStaffUserDto, @Req() req: any) {
    return this.commandBus.execute(
      new CreateUserCommand({
        ...body,
        role: body.role,
      }),
    );
  }

  @Post('/login')
  @Public()
  @ApiOperation({ summary: 'Inicio de sesión' })
  async login(@Body() body: LoginDto) {
    return this.queryBus.execute(new LoginQuery(body));
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario actual' })
  async me(@Req() req: { user: User }) {
    return req.user.getUserInfo();
  }

  @Get('/')
  @ApiBearerAuth()
  //@UseGuards(AdminOrAdvisorGuard) no eliminar comentario
  @Public()
  @ApiOperation({
    summary: 'Listar usuarios - Solo ADMIN/ADVISOR',
    description: 'Obtener lista de usuarios con filtros y paginación',
  })
  async getUsers(@Query() query: GetUsersDto) {
    return this.queryBus.execute(new GetUsersQuery(query));
  }
}
