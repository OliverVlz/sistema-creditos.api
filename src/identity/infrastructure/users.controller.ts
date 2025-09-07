import { Body, Controller, Post, Get, Req, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/shared/validation';
import { UserRole } from 'src/shared/enums/user-role.enum';

import { CreateUserCommand } from '../application/create-user/create-user.command';
import { LoginQuery } from '../application/login/login.query';
import { GetUsersQuery } from '../application/get-users/get-users.query';

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
  @ApiOperation({ summary: 'Public user registration (CLIENT role only)' })
  async signUp(@Body() body: CreateUserDto) {
    return this.commandBus.execute(new CreateUserCommand({
      ...body,
      role: UserRole.CLIENT, // Forzar role CLIENT para seguridad
    }));
  }

  @Post('/admin/staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create staff user (ADMIN/ADVISOR) - Admin only' })
  async createStaff(@Body() body: CreateStaffUserDto, @Req() req: any) {
    // TODO: Añadir guard para verificar que solo ADMIN puede crear staff
    return this.commandBus.execute(new CreateUserCommand({
      ...body,
      role: body.role, // Permitir ADMIN/ADVISOR
    }));
  }

  @Post('/login')
  @Public()
  @ApiOperation({ summary: 'User login' })
  async login(@Body() body: LoginDto) {
    return this.queryBus.execute(new LoginQuery(body));
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  async me(@Req() req: { user: User }) {
    return req.user.getUserInfo();
  }

  @Get('/')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users with optional filters and pagination' })
  async getUsers(@Query() query: GetUsersDto) {
    return this.queryBus.execute(new GetUsersQuery(query));
  }
}
