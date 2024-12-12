import { Reflector } from '@nestjs/core';
import { number } from 'joi';

export const Throttle = Reflector.createDecorator<{
  count: number;
  unit: 'minute';
}>();
