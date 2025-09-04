import { Body, Controller, Post, Get, Req, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { Public } from 'src/shared/validation';

import { CreateUserCommand } from '../application/create-user/create-user.command';
import { LoginQuery } from '../application/login/login.query';
import { GetUsersQuery } from '../application/get-users/get-users.query';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { User } from '../domain/user.model';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/sign-up')
  @Public()
  @Recaptcha()
  async signUp(@Body() body: CreateUserDto) {
    return this.commandBus.execute(new CreateUserCommand(body));
  }

  @Post('/login')
  @Public()
  async login(@Body() body: LoginDto) {
    return this.queryBus.execute(new LoginQuery(body));
  }

  @Get('/me')
  @ApiBearerAuth()
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
