import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles, IsAdminGuard, IsCustomerGuard, IsEmployeeGuard } from '../guards';
import { UserRole } from '../enums';

// Decorador compuesto para admin
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(IsAdminGuard),
    ApiBearerAuth(),
  );

// Decorador compuesto para cliente
export const CustomerOnly = () =>
  applyDecorators(
    UseGuards(IsCustomerGuard),
    ApiBearerAuth(),
  );

// Decorador compuesto para empleado
export const EmployeeOnly = () =>
  applyDecorators(
    UseGuards(IsEmployeeGuard),
    ApiBearerAuth(),
  );

// Decorador compuesto para staff (admin + empleado)
export const StaffOnly = () =>
  applyDecorators(
    Roles(UserRole.Admin, UserRole.Employee),
    ApiBearerAuth(),
  );

// Decorador compuesto para autenticado (cualquier rol)
export const AuthenticatedOnly = () =>
  applyDecorators(
    ApiBearerAuth(),
  );
