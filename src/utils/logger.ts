import { c } from './color.ts';

export const log = {
  info(msg: string) {
    console.log(`${c.info('i')} ${msg}`);
  },
  success(msg: string) {
    console.log(`${c.success('✓')} ${msg}`);
  },
  warn(msg: string) {
    console.log(`${c.warn('!')} ${msg}`);
  },
  error(msg: string) {
    console.error(`${c.error('✗')} ${msg}`);
  },
  dim(msg: string) {
    console.log(c.dim(msg));
  },
};
