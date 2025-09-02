import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

describe('UserService.updateProfile', () => {
  const makeService = (userDoc: any, conflict = false) => {
    const model: any = {
      findById: jest.fn().mockResolvedValue(userDoc),
      findOne: jest.fn().mockResolvedValue(conflict ? { _id: 'other' } : null),
    };
    return { service: new UserService(model), model };
  };

  beforeEach(() => jest.clearAllMocks());

  it('updates email and marks as unverified when unique', async () => {
    const saved = {
      _id: 'u1',
      email: 'b@b.com',
      isEmailVerified: false,
      role: 'user',
      isActive: true,
      notificationPreferences: {
        email: true,
        breakingChanges: true,
        nonBreakingChanges: false,
        apiErrors: true,
      },
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const userDoc: any = {
      _id: 'u1',
      email: 'a@a.com',
      isActive: true,
      save: jest.fn().mockResolvedValue(saved),
    };
    const { service, model } = makeService(userDoc, false);
    const res = await service.updateProfile('u1', { email: 'b@b.com' });
    expect(model.findById).toHaveBeenCalledWith('u1');
    expect(model.findOne).toHaveBeenCalled();
    expect(userDoc.email).toBe('b@b.com');
    expect(userDoc.isEmailVerified).toBe(false);
    expect(res.email).toBe('b@b.com');
  });

  it('throws NotFound when user missing', async () => {
    const model: any = { findById: jest.fn().mockResolvedValue(null) };
    const service = new UserService(model);
    await expect(
      service.updateProfile('u1', { email: 'x@y.com' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Conflict when email already in use', async () => {
    const userDoc: any = {
      _id: 'u1',
      email: 'a@a.com',
      isActive: true,
      save: jest.fn(),
    };
    const { service } = makeService(userDoc, true);
    await expect(
      service.updateProfile('u1', { email: 'a2@a.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
