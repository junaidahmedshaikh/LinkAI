import { User, IUserDocument } from "../models/User.model";
import type { ExperienceLevel } from "@linkai/types";

class UserService {
  async completeOnboarding(
    userId: string,
    data: {
      jobTitle: string;
      industry: string;
      experienceLevel: ExperienceLevel;
    }
  ): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        profile: {
          jobTitle: data.jobTitle,
          industry: data.industry,
          experienceLevel: data.experienceLevel,
          onboardingCompleted: true,
        },
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getById(userId: string): Promise<IUserDocument | null> {
    return User.findById(userId);
  }
}

export const userService = new UserService();
