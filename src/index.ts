#!/usr/bin/env bun
import { dispatch } from './cli/dispatcher.ts';
import { log } from './utils/logger.ts';

try {
  await dispatch(process.argv);
} catch (err) {
  log.error((err as Error).message);
  process.exit(1);
}
