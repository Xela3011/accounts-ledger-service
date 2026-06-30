import 'dotenv/config';
import 'reflect-metadata';
import dataSource from './typeorm.config';
import { AccountEntity, AccountStatus } from '../../accounts/entities/account.entity';
import { PasswordService } from '../../auth/password.service';
import { UserEntity } from '../../users/entities/user.entity';

const seedUser = {
  email: process.env.SEED_USER_EMAIL ?? 'seed.user@example.com',
  password: process.env.SEED_USER_PASSWORD ?? 'Password123!',
  name: process.env.SEED_USER_NAME ?? 'Alexander',
  lastName: process.env.SEED_USER_LAST_NAME ?? 'Batista',
};

const seedAccount = {
  accountNumber: process.env.SEED_ACCOUNT_NUMBER ?? 'QIK-SEED-0001',
  currency: process.env.SEED_ACCOUNT_CURRENCY ?? 'DOP',
  balance: process.env.SEED_ACCOUNT_BALANCE ?? '100000.0000',
  status: AccountStatus.Active,
};

async function seed(): Promise<void> {
  await dataSource.initialize();

  const usersRepository = dataSource.getRepository(UserEntity);
  const accountsRepository = dataSource.getRepository(AccountEntity);
  const passwordService = new PasswordService();

  let user = await usersRepository.findOne({
    where: { email: seedUser.email.toLowerCase() },
  });

  if (!user) {
    user = usersRepository.create({
      email: seedUser.email.toLowerCase(),
    });
  }

  user.name = seedUser.name;
  user.lastName = seedUser.lastName;
  user.passwordHash = await passwordService.hash(seedUser.password);
  user = await usersRepository.save(user);

  let account = await accountsRepository.findOne({
    where: { accountNumber: seedAccount.accountNumber },
  });

  if (!account) {
    account = accountsRepository.create({
      accountNumber: seedAccount.accountNumber,
    });
  }

  account.ownerId = user.id;
  account.currency = seedAccount.currency;
  account.balance = seedAccount.balance;
  account.status = seedAccount.status;
  await accountsRepository.save(account);

  console.log(`Seeded user ${user.email} with account ${account.accountNumber}`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
