import { beforeEach, describe, expect, it } from '@jest/globals';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes and verifies passwords', async () => {
    const hash = await service.hash('correct-password');

    expect(hash).not.toBe('correct-password');
    await expect(service.verify('correct-password', hash)).resolves.toBe(true);
    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });
});
