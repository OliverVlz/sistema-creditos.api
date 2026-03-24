import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/shared/validation';
import { AdminOrAdvisorGuard, AdminGuard } from 'src/shared/guards';

import { CreateUserCommand } from '../application/create-user/create-user.command';
import { UpdatePasswordCommand } from '../application/update-password/update-password.command';
import { UpdatePasswordAdminCommand } from '../application/update-password-admin/update-password-admin.command';
import { UpdateUserProfileCommand } from '../application/update-user-profile/update-user-profile.command';
import { UpdateUserAdminCommand } from '../application/update-user-admin/update-user-admin.command';
import { RecoverPasswordCommand } from '../application/recover-password/recover-password.command';
import { ResetPasswordCommand } from '../application/reset-password/reset-password.command';
import { LoginQuery } from '../application/login/login.query';
import { GetUsersQuery } from '../application/get-users/get-users.query';
import { GetUserByIdQuery } from '../application/get-user-by-id/get-user-by-id.query';
import { GetMeQuery } from '../application/get-me/get-me.query';

import { LoginDto } from './dto/login.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdatePasswordAdminDto } from './dto/update-password-admin.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  //@UseGuards(AdminGuard)
  @Public()
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
      }),
    );
  }

  @Post('/login')
  @Public()
  @ApiOperation({ summary: 'Inicio de sesión' })
  async login(@Body() body: LoginDto) {
    return this.queryBus.execute(new LoginQuery(body));
  }

  @Post('/forgot-password')
  @Public()
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.commandBus.execute(new RecoverPasswordCommand(body.email));
    return {
      message:
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    };
  }

  @Post('/reset-password')
  @Public()
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.commandBus.execute(
      new ResetPasswordCommand({
        token: body.token,
        newPassword: body.newPassword,
      }),
    );
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener información del usuario actual',
    description:
      'Retorna la información del usuario autenticado. ' +
      'Si el usuario es CLIENTE, incluye también el clientId.',
  })
  async me(@Req() req: { user: User }) {
    return this.queryBus.execute(new GetMeQuery(req.user));
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
        ...body,
      }),
    );
  }

  @Patch('/:userId/password')
  @ApiBearerAuth()
  //@UseGuards(AdminGuard)
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
        ...body,
      }),
    );
  }

  @Get('/all')
  @ApiBearerAuth()
  //@UseGuards(AdminOrAdvisorGuard)
  @Public()
  @ApiOperation({
    summary: 'Listar usuarios - Solo ADMIN/ADVISOR',
    description: 'Obtener lista de usuarios con filtros y paginación',
  })
  async getUsers(@Query() query: GetUsersDto) {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Get('/:userId')
  @ApiBearerAuth()
  //@UseGuards(AdminOrAdvisorGuard)
  @Public()
  @ApiOperation({
    summary: 'Obtener usuario por ID - Solo ADMIN/ADVISOR',
    description: 'Obtener los detalles de un usuario específico por su ID',
  })
  async getUserById(@Param('userId') userId: string) {
    return this.queryBus.execute(new GetUserByIdQuery(userId));
  }

  @Patch('/me/profile')
  @ApiBearerAuth()
  //@UseGuards(AdminOrAdvisorGuard)
  //@Public()
  @ApiOperation({
    summary: 'Actualizar perfil propio - ADMIN/ADVISOR',
    description:
      'Permite a usuarios staff (ADMIN/ADVISOR) actualizar su propio perfil. ' +
      'Solo pueden modificar: firstName, lastName, phoneNumber. ' +
      'NO pueden cambiar: email, documentNumber, role, isActive, password.',
  })
  async updateMyProfile(@Body() body: UpdateUserProfileDto, @Req() req: any) {
    return this.commandBus.execute(
      new UpdateUserProfileCommand({
        userId: req.user.id,
        ...body,
      }),
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
      new UpdateUserAdminCommand({
        userId,
        ...body,
      }),
    );
  }
}
