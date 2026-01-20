import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/auth';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Create a new user
 */
export const createUser = async (dto: CreateUserDto): Promise<User> => {
  const hashedPassword = await hashPassword(dto.password);

  const result = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [dto.email, hashedPassword, dto.name]
  );

  return result.rows[0];
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Authenticate user (login)
 */
export const authenticateUser = async (dto: LoginDto): Promise<User | null> => {
  const user = await findUserByEmail(dto.email);

  if (!user) {
    return null;
  }

  const isValid = await comparePassword(dto.password, user.password_hash);

  if (!isValid) {
    return null;
  }

  return user;
};

/**
 * Save refresh token
 */
export const saveRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> => {
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
};

/**
 * Validate refresh token
 */
export const validateRefreshToken = async (
  token: string
): Promise<boolean> => {
  const result = await query(
    `SELECT * FROM refresh_tokens
     WHERE token = $1
     AND expires_at > NOW()`,
    [token]
  );

  return result.rows.length > 0;
};

/**
 * Delete refresh token
 */
export const deleteRefreshToken = async (token: string): Promise<void> => {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};

/**
 * Delete all refresh tokens for a user (logout all devices)
 */
export const deleteAllRefreshTokens = async (userId: string): Promise<void> => {
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
};
