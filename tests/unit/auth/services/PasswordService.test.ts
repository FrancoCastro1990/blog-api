import { PasswordService } from "../../../../src/auth/services";

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      // Arrange
      const plainPassword = 'mySecurePassword123';

      // Act
      const hashedPassword = await passwordService.hash(plainPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are long
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    it('should generate different hashes for the same password', async () => {
      // Arrange
      const plainPassword = 'samePassword';

      // Act
      const hash1 = await passwordService.hash(plainPassword);
      const hash2 = await passwordService.hash(plainPassword);

      // Assert
      expect(hash1).not.toBe(hash2); // Salt makes them different
    });

    it('should handle empty password', async () => {
      // Arrange
      const plainPassword = '';

      // Act
      const hashedPassword = await passwordService.hash(plainPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should handle very long passwords', async () => {
      // Arrange
      const longPassword = 'a'.repeat(1000);

      // Act
      const hashedPassword = await passwordService.hash(longPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });

  describe('verify', () => {
    it('should verify correct password successfully', async () => {
      // Arrange
      const plainPassword = 'correctPassword123';
      const hashedPassword = await passwordService.hash(plainPassword);

      // Act
      const isValid = await passwordService.verify(plainPassword, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      // Arrange
      const plainPassword = 'correctPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await passwordService.hash(plainPassword);

      // Act
      const isValid = await passwordService.verify(wrongPassword, hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject empty password against valid hash', async () => {
      // Arrange
      const plainPassword = 'somePassword';
      const hashedPassword = await passwordService.hash(plainPassword);

      // Act
      const isValid = await passwordService.verify('', hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format gracefully', async () => {
      // Arrange
      const plainPassword = 'somePassword';
      const invalidHash = 'not-a-valid-hash';

      // Act & Assert
      // bcrypt.compare returns false for invalid hash format instead of throwing
      const isValid = await passwordService.verify(plainPassword, invalidHash);
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      // Arrange
      const plainPassword = 'CaseSensitive';
      const hashedPassword = await passwordService.hash(plainPassword);

      // Act
      const isValidLower = await passwordService.verify('casesensitive', hashedPassword);
      const isValidUpper = await passwordService.verify('CASESENSITIVE', hashedPassword);
      const isValidCorrect = await passwordService.verify('CaseSensitive', hashedPassword);

      // Assert
      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
      expect(isValidCorrect).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in password', async () => {
      // Arrange
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Act
      const hashedPassword = await passwordService.hash(specialPassword);
      const isValid = await passwordService.verify(specialPassword, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const unicodePassword = 'contraseña🔒密码';
      
      // Act
      const hashedPassword = await passwordService.hash(unicodePassword);
      const isValid = await passwordService.verify(unicodePassword, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });
  });
});