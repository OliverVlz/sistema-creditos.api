import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles, IsAdminGuard, IsClientGuard, IsAdvisorGuard } from '../guards';
import { UserRole } from '../enums';

// Decorador compuesto para admin
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(IsAdminGuard),
    ApiBearerAuth(),
  );

// Decorador compuesto para cliente
export const ClientOnly = () =>
  applyDecorators(
    UseGuards(IsClientGuard),
    ApiBearerAuth(),
  );

// Decorador compuesto para asesor
export const AdvisorOnly = () =>
  applyDecorators(
    UseGuards(IsAdvisorGuard),
    ApiBearerAuth(),
  );

// Decorador compuesto para staff (admin + asesor)
export const StaffOnly = () =>
  applyDecorators(
    Roles(UserRole.Admin, UserRole.Advisor),
    ApiBearerAuth(),
  );

// Decorador compuesto para autenticado (cualquier rol)
export const AuthenticatedOnly = () =>
  applyDecorators(
    ApiBearerAuth(),
  );
