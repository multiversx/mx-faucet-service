import { createParamDecorator } from '@nestjs/common';

export const Jwt = createParamDecorator((data, req) => {
  const jwt = req.args[0].jwt ?? req.args[0].nativeAuth;

  return jwt && data ? jwt[data] : jwt;
});
