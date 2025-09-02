import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { ApiBearerAuth } from '@nestjs/swagger';

import { Public } from 'src/shared/validation';

import { CreateUserCommand } from '../application/create-user/create-user.command';
import { LoginQuery } from '../application/login/login.query';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
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
}
