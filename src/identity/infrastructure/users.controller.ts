import { Body, Controller, Post, Get, Req, Query, ForbiddenException, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/shared/validation';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { AdminOrAdvisorGuard, AdminGuard, AdvisorGuard } from 'src/shared/guards';

import { CreateUserCommand } from '../application/create-user/create-user.command';
import { LoginQuery } from '../application/login/login.query';
import { GetUsersQuery } from '../application/get-users/get-users.query';
import { GetUsersClientInfoQuery } from '../application/get-users-client-info/get-users-client-info.query';
import { GetUsersClientInfoByIdQuery } from '../application/get-users-client-info-by-id/get-users-client-info-by-id.query';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
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
  @Recaptcha()
  @ApiOperation({ 
    summary: 'Auto-registro público de clientes',
    description: 'Permite que cualquier persona se registre como CLIENT. No requiere autenticación.'
  })
  async signUp(@Body() body: CreateUserDto) {
    return this.commandBus.execute(new CreateUserCommand({
      ...body,
      role: UserRole.CLIENT,
    }));
  }

  @Post('/admin/users')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ 
    summary: 'Crear cualquier tipo de usuario - Solo ADMIN',
    description: 'Permite a ADMIN crear usuarios con cualquier rol: CLIENT, ADVISOR, ADMIN'
  })
  async createUserAsAdmin(@Body() body: CreateStaffUserDto, @Req() req: any) {
    return this.commandBus.execute(new CreateUserCommand({
      ...body,
      role: body.role,
    }));
  }

  @Post('/advisor/clients')
  @ApiBearerAuth()
  @UseGuards(AdvisorGuard)
  @ApiOperation({ 
    summary: 'Crear clientes - Solo ADVISOR',
    description: 'Permite a ADVISOR crear únicamente usuarios con rol CLIENT'
  })
  async createClientAsAdvisor(@Body() body: CreateUserDto, @Req() req: any) {
    return this.commandBus.execute(new CreateUserCommand({
      ...body,
      role: UserRole.CLIENT,
    }));
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

  @Get('/me/profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil completo del cliente actual',
    description: 'Devuelve la información del usuario autenticado y su perfil de cliente (crédito, etc.). Solo accesible por el propio cliente.'
  })
  async getMyClientProfile(@Req() req: any) {
    return this.queryBus.execute(new GetUsersClientInfoByIdQuery(req.user.id));
  }

  @Get('/')
  @ApiBearerAuth()
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({ 
    summary: 'Listar usuarios - Solo ADMIN/ADVISOR',
    description: 'Obtener lista de usuarios con filtros y paginación'
  })
  async getUsers(@Query() query: GetUsersDto) {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Get('/clients')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Obtener clientes con información crediticia - Solo ADMIN/ADVISOR',
    description: 'Devuelve usuarios con rol CLIENT y su perfil crediticio asociado'
  })
  async getUsersWithClientInfo(@Query() query: GetUsersDto) {
    return this.queryBus.execute(new GetUsersClientInfoQuery(query));
  }

  @Get('/clients/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener información de cliente por id',
    description: 'Devuelve información de cliente (perfil crediticio, préstamos, etc) para el id indicado. Solo accesible por ADMIN, ADVISOR o el propio cliente.'
  })
  async getClientInfoById(@Query('id') id: string, @Req() req: any) {
    const currentUser = req.user;
    // Permitir solo si es admin, advisor o el propio cliente
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.ADVISOR &&
      currentUser.id !== id
    ) {
      throw new ForbiddenException('Permisos insuficientes');
    }
    // Aquí puedes usar un query similar a GetMyClientInfoQuery pero por id
  return this.queryBus.execute(new GetUsersClientInfoByIdQuery(id));
  }
}
