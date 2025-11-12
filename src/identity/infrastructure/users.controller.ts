import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
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

import { CreateUserCommand } from '../application/create-user/create-user.command';
import { UpdatePasswordCommand } from '../application/update-password/update-password.command';
import { UpdatePasswordAdminCommand } from '../application/update-password-admin/update-password-admin.command';
import { UpdateUserProfileCommand } from '../application/update-user-profile/update-user-profile.command';
import { UpdateUserAdminCommand } from '../application/update-user-admin/update-user-admin.command';
import { LoginQuery } from '../application/login/login.query';
import { GetUsersQuery } from '../application/get-users/get-users.query';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdatePasswordAdminDto } from './dto/update-password-admin.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { User } from '../domain/user.model';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/staff')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Crear usuario staff (Advisor/Admin) - Solo ADMIN',
    description:
      'Permite a ADMIN crear usuarios con rol ADVISOR o ADMIN (personal interno). ' +
      'Para crear clientes usar POST /clients o POST /clients/sign-up',
  })
  async createStaff(@Body() body: CreateStaffUserDto, @Req() req: any) {
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

  @Patch('/me/password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cambiar contraseña del usuario autenticado',
    description:
      'Permite al usuario cambiar su propia contraseña. ' +
      'Requiere proporcionar la contraseña actual para validación.',
  })
  async updateMyPassword(@Body() body: UpdatePasswordDto, @Req() req: any) {
    return this.commandBus.execute(
      new UpdatePasswordCommand({
        userId: req.user.id,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      }),
    );
  }

  @Patch('/:userId/password')
  @ApiBearerAuth()
  //@UseGuards(AdminGuard) // Descomenta cuando estés listo
  @Public()
  @ApiOperation({
    summary: 'Cambiar contraseña de cualquier usuario - Solo ADMIN',
    description:
      'Permite al ADMIN cambiar la contraseña de cualquier usuario. ' +
      'No requiere la contraseña actual. Útil para recuperación de acceso.',
  })
  async updateUserPassword(
    @Param('userId') userId: string,
    @Body() body: UpdatePasswordAdminDto,
  ) {
    return this.commandBus.execute(
      new UpdatePasswordAdminCommand({
        userId,
        newPassword: body.newPassword,
      }),
    );
  }

  @Get('/')
  @ApiBearerAuth()
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({
    summary: 'Listar usuarios - Solo ADMIN/ADVISOR',
    description: 'Obtener lista de usuarios con filtros y paginación',
  })
  async getUsers(@Query() query: GetUsersDto) {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Patch('/me/profile')
  @ApiBearerAuth()
  //@UseGuards(AdminOrAdvisorGuard) // Descomenta cuando estés listo
  @Public()
  @ApiOperation({
    summary: 'Actualizar perfil propio - ADMIN/ADVISOR',
    description:
      'Permite a usuarios staff (ADMIN/ADVISOR) actualizar su propio perfil. ' +
      'Solo pueden modificar: firstName, lastName, phoneNumber. ' +
      'NO pueden cambiar: email, documentNumber, role, isActive, password.',
  })
  async updateMyProfile(@Body() body: UpdateUserProfileDto, @Req() req: any) {
    return this.commandBus.execute(
      new UpdateUserProfileCommand(
        req.user.id,
        body.firstName,
        body.lastName,
        body.phoneNumber,
      ),
    );
  }

  @Patch('/:userId')
  @ApiBearerAuth()
  //@UseGuards(AdminGuard) // Descomenta cuando estés listo
  @Public()
  @ApiOperation({
    summary: 'Actualizar cualquier usuario - Solo ADMIN',
    description:
      'Permite al ADMIN actualizar cualquier campo de cualquier usuario. ' +
      'Puede modificar: firstName, lastName, email, documentNumber, phoneNumber, role, isActive. ' +
      'La contraseña se actualiza mediante PATCH /users/:userId/password',
  })
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: UpdateUserAdminDto,
  ) {
    return this.commandBus.execute(
      new UpdateUserAdminCommand(
        userId,
        body.firstName,
        body.lastName,
        body.email,
        body.documentNumber,
        body.phoneNumber,
        body.role,
        body.isActive,
      ),
    );
  }
}
