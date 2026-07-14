import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { DoctorProfile, Room, User } from '../entities';
import { Role, SPECIALTIES } from '../common/enums';
import { CreateDoctorDto, CreateRoomDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(DoctorProfile) private profiles: Repository<DoctorProfile>,
    @InjectRepository(Room) private rooms: Repository<Room>,
  ) {}

  specialties(): string[] {
    return [...SPECIALTIES];
  }

  async listDoctors(specialty?: string) {
    const where = specialty ? { specialty } : {};
    const profiles = await this.profiles.find({
      where,
      relations: { user: true },
      order: { specialty: 'ASC' },
    });
    return profiles.map((p) => ({
      id: p.userId,
      fullName: p.user.fullName,
      specialty: p.specialty,
      bio: p.bio,
    }));
  }

  async createDoctor(dto: CreateDoctorDto) {
    if (await this.users.findOneBy({ email: dto.email.toLowerCase() })) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.users.save(
      this.users.create({
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 10),
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        role: Role.DOCTOR,
      }),
    );
    await this.profiles.save(
      this.profiles.create({
        userId: user.id,
        specialty: dto.specialty,
        bio: dto.bio ?? null,
      }),
    );
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      doctorProfile: { specialty: dto.specialty, bio: dto.bio ?? null },
    };
  }

  async listUsers(role?: Role) {
    const users = await this.users.find({
      where: role ? { role } : {},
      relations: { doctorProfile: true },
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      doctorProfile: u.doctorProfile
        ? { specialty: u.doctorProfile.specialty, bio: u.doctorProfile.bio }
        : undefined,
    }));
  }

  listRooms() {
    return this.rooms.find({ order: { branch: 'ASC', name: 'ASC' } });
  }

  createRoom(dto: CreateRoomDto) {
    return this.rooms.save(this.rooms.create(dto));
  }

  async findDoctorProfile(userId: string): Promise<DoctorProfile> {
    const profile = await this.profiles.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Doctor not found');
    return profile;
  }
}
