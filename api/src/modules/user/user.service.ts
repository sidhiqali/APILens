import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/Schemas/user.schema';
import { UserDocument, IUser } from 'src/types/user.type';
import { NotificationPreferencesDto } from '../auth/dto/auth-extended.dto';
import { toSafeUser } from 'utils/user';
import { CreateUserData } from 'src/types/auth.type';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: CreateUserData): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, isActive: true });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
    });
  }

  async findByEmailVerificationToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
      isActive: true,
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      refreshToken,
      refreshTokenExpires: { $gt: new Date() },
      isActive: true,
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken,
      refreshTokenExpires: expiresAt,
    });
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    });
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null,
      refreshTokenExpires: null,
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      refreshToken: null,
      refreshTokenExpires: null,
    });
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toSafeUser(user);
  }

  // async updateProfile(
  //   userId: string,
  //   updateData: UpdateProfileDto,
  // ): Promise<IUser> {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // Check if email is being changed and if it already exists
  //   if (updateData.email && updateData.email !== user.email) {
  //     const existingUser = await this.findByEmail(updateData.email);
  //     if (existingUser) {
  //       throw new ConflictException('Email already in use');
  //     }

  //     // If email is changed, require re-verification
  //     updateData.isEmailVerified = false;
  //     // You might want to send a new verification email here
  //   }

  //   const updatedUser = await this.userModel.findByIdAndUpdate(
  //     userId,
  //     updateData,
  //     { new: true },
  //   );

  //   return toSafeUser(updatedUser);
  // }

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferencesDto,
  ): Promise<{
    message: string;
    preferences: any;
  }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedPreferences = {
      ...user.notificationPreferences,
      ...preferences,
    };

    await this.userModel.findByIdAndUpdate(userId, {
      notificationPreferences: updatedPreferences,
    });

    return {
      message: 'Notification preferences updated successfully',
      preferences: updatedPreferences,
    };
  }

  async deactivateAccount(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isActive: false,
      refreshToken: null,
      refreshTokenExpires: null,
    });
  }

  async reactivateAccount(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isActive: true,
    });
  }

  // Admin methods
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find({ isActive: true })
        .select(
          '-password -refreshToken -passwordResetToken -emailVerificationToken',
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments({ isActive: true }),
    ]);

    return {
      users: users.map((user) => toSafeUser(user)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    recentRegistrations: number;
  }> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, verifiedUsers, activeUsers, recentRegistrations] =
      await Promise.all([
        this.userModel.countDocuments({ isActive: true }),
        this.userModel.countDocuments({
          isActive: true,
          isEmailVerified: true,
        }),
        this.userModel.countDocuments({
          isActive: true,
          lastLoginAt: { $gte: lastWeek },
        }),
        this.userModel.countDocuments({
          isActive: true,
          createdAt: { $gte: lastWeek },
        }),
      ]);

    return {
      totalUsers,
      verifiedUsers,
      activeUsers,
      recentRegistrations,
    };
  }
}
