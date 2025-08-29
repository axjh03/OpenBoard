import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async signUp(username: string, password: string) {
    // Check if username already exists
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Create new user
    const newUser = new this.userModel({ username, password });
    const savedUser = await newUser.save();

    return {
      success: true,
      message: 'User created successfully',
      userId: savedUser._id,
      user: {
        id: savedUser._id,
        username: savedUser.username,
      },
    };
  }

  async signIn(username: string, password: string) {
    // Find user by username and password
    const user = await this.userModel.findOne({ username, password });
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Update last login
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { updatedAt: new Date() } }
    );

    return {
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user._id,
        username: user.username,
        updatedAt: new Date(),
      },
    };
  }
}
