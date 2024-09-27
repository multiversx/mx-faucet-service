import { createParamDecorator } from '@nestjs/common';

export const ClientIp = createParamDecorator((_, req) => {
  return req.args[0].clientIp;
});
