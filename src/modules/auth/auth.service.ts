import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { addMinutes, isAfter } from 'date-fns';
import { VerifyResetOtpDto } from '../mail/verifyresetotp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private mailService: MailService,
  ) {}
  async register(registerDto: RegisterDto) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: hashedPassword,
        wallet: 0,
      },
    });

    await this.prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        lastUpdated: new Date(),
      },
    });

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log(user.id);
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: user.id },
    });
    console.log(wallet?.balance);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        wallet: wallet?.balance,
      },
    };
  }

  async handleGoogleLogin(googleUser: any) {
    const { email, name } = googleUser;

    let user = await this.prisma.user.findUnique({ where: { email } });

    // Nếu chưa thì tạo user mới
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          passwordHash: '', // Google login thì không cần password
          wallet: 0,
        },
      });
      await this.prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          lastUpdated: new Date(),
        },
      });
    }

    // Tạo JWT
    const access_token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' },
    );

    return { user, access_token };
  }

  async requestResetPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Email không tồn tại.');
    }

    if (user.passwordHash === '') {
      throw new BadRequestException('Tài khoản này đăng nhập bằng Google.');
    }

    // Tìm OTP gần nhất (used = false)
    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    // Nếu đã gửi trong vòng 5 phút → không cho gửi lại
    if (latestOtp && isAfter(addMinutes(latestOtp.createdAt, 5), now)) {
      throw new BadRequestException(
        'Bạn chỉ có thể yêu cầu gửi lại mã OTP sau 5 phút.',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otpVerification.create({
      data: {
        email,
        otp,
        createdAt: now,
        used: false,
      },
    });

    await this.mailService.sendOtpEmail(email, otp);

    return { message: 'Mã OTP đã được gửi tới email của bạn.' };
  }

  async verifyResetOtp(
    dto: VerifyResetOtpDto,
  ): Promise<{ success: boolean; message?: string }> {
    const { email, otp } = dto;

    const otpNumber = parseInt(otp, 10);
    const existing = await this.prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        used: false,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // trong 5 phút
      },
    });

    if (!existing) {
      return { success: false, message: 'OTP không đúng hoặc đã hết hạn.' };
    }

    // Đánh dấu là đã dùng
    await this.prisma.otpVerification.update({
      where: { id: existing.id },
      data: { used: true },
    });

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    // Kiểm tra OTP đã xác thực hay chưa
    const existingOtp = await this.prisma.otpVerification.findFirst({
      where: {
        email,
        used: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existingOtp) {
      throw new BadRequestException('Bạn cần xác thực OTP trước');
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu
    await this.prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
      },
    });

    // Xóa OTP đã dùng
    await this.prisma.otpVerification.deleteMany({
      where: { email },
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  // auth.service.ts
async changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new BadRequestException('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await this.prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword }
  });

  return { message: 'Password updated successfully' };
}




}
